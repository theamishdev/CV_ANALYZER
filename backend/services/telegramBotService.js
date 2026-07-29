const { Telegraf } = require('telegraf');
const parserService = require('./parserService');
const aiService = require('./aiService');

let bot = null;

// In-memory store for user states.
const userStates = {}; 

function initBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN not found in env. Telegram bot disabled.');
        return;
    }

    bot = new Telegraf(token);
    
    bot.start((ctx) => {
        const chatId = ctx.chat.id;
        userStates[chatId] = { state: 'IDLE' };
        
        ctx.reply("Welcome to CV Buddy Bot! 🤖\nI can analyze your CV against a Job Description.\n\nTap the button below to start!", {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📊 Analyze CV', callback_data: 'start_analyze' }
                ]]
            }
        });
    });

    bot.action('start_analyze', (ctx) => {
        const chatId = ctx.chat.id;
        userStates[chatId] = { state: 'AWAITING_CV' };
        ctx.reply("Great! Please upload your CV as a PDF or DOCX file 📎");
        ctx.answerCbQuery();
    });
    
    bot.command('analyze', (ctx) => {
        const chatId = ctx.chat.id;
        userStates[chatId] = { state: 'AWAITING_CV' };
        ctx.reply("Great! Please upload your CV as a PDF or DOCX file.");
    });
    
    bot.on('document', async (ctx) => {
        const chatId = ctx.chat.id;
        const userState = userStates[chatId] || { state: 'IDLE' };
        
        if (userState.state !== 'AWAITING_CV') {
            return ctx.reply("Please send /analyze to start the process.");
        }
        
        const doc = ctx.message.document;
        if (!doc.file_name.endsWith('.pdf') && !doc.file_name.endsWith('.docx')) {
            return ctx.reply("Please send a valid PDF or DOCX file.");
        }
        
        try {
            ctx.reply("Downloading and extracting CV...");
            const fileLink = await ctx.telegram.getFileLink(doc.file_id);
            const response = await fetch(fileLink.toString());
            const buffer = await response.arrayBuffer();
            const nodeBuffer = Buffer.from(buffer);
            
            let cvText = '';
            if (doc.file_name.endsWith('.pdf')) {
                cvText = await parserService.parsePdf(nodeBuffer);
            } else if (doc.file_name.endsWith('.docx')) {
                cvText = await parserService.parseDocx(nodeBuffer);
            }
            
            if (!cvText || cvText.trim() === '') {
                throw new Error("Could not extract text from document.");
            }
            
            userStates[chatId].cvText = cvText;
            userStates[chatId].state = 'AWAITING_JD';
            
            ctx.reply("CV successfully parsed! ✅\nNow, please paste the Job Description (text).");
            
        } catch (error) {
            console.error("Error processing document:", error);
            ctx.reply(`Oops! Something went wrong while parsing your CV. Please try again.\n\nDebug Info: ${error.message}`);
            userStates[chatId].state = 'IDLE';
        }
    });
    
    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const text = ctx.message.text;
        
        if (text.startsWith('/')) return;
        
        const userState = userStates[chatId] || { state: 'IDLE' };
        
        if (userState.state === 'AWAITING_JD') {
            ctx.reply("Analyzing your CV against the JD... This may take a few seconds ⏳");
            
            try {
                const jdText = text;
                const cvText = userState.cvText;
                
                const analysis = await aiService.analyzeCvVsJd(cvText, jdText);
                
                let responseMsg = `📊 ATS Match Score: ${analysis.matchScore}%\n\n`;
                responseMsg += `Predicted Title: ${analysis.predictedTitle}\n`;
                responseMsg += `Seniority: ${analysis.predictedExperienceLevel}\n\n`;
                
                if (analysis.matchedSkills && analysis.matchedSkills.length > 0) {
                    responseMsg += `✅ Matched Skills:\n- ${analysis.matchedSkills.join('\n- ')}\n\n`;
                }
                
                if (analysis.missingSkills && analysis.missingSkills.length > 0) {
                    responseMsg += `❌ Missing Skills:\n- ${analysis.missingSkills.join('\n- ')}\n\n`;
                }
                
                if (analysis.suggestions && analysis.suggestions.length > 0) {
                    responseMsg += `💡 Improvements:\n`;
                    analysis.suggestions.forEach(s => {
                         responseMsg += `- ${s.actionTitle}: ${s.actionDetails}\n`;
                    });
                }
                
                ctx.reply(responseMsg);
                
                userStates[chatId] = { state: 'IDLE' };
                
            } catch (error) {
                console.error("Error in AI analysis:", error);
                ctx.reply("Sorry, I encountered an error while analyzing the CV. Please try again later.");
                userStates[chatId] = { state: 'IDLE' };
            }
        } else if (userState.state === 'IDLE') {
            ctx.reply("Not sure what to do? 🤔\n\nClick the menu button or send /analyze to start checking your CV against a Job Description!");
        } else if (userState.state === 'AWAITING_CV') {
            ctx.reply("I'm waiting for your CV! Please upload it as a PDF or DOCX file 📎");
        }
    });

    bot.catch((err, ctx) => {
        console.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
    });

    bot.launch();
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    console.log("Telegram Bot initialized via Telegraf!");
}

module.exports = {
    initBot
};
