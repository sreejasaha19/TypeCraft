// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const typingPracticeContext = {
    currentWord: '',
    startTime: 0,
    correctWords: 0,
    totalWords: 0,
    totalTime: 0,
};


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "typingpractice" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('typingpractice.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Typing Practice!');
	});

	context.subscriptions.push(disposable);
	let disposable1 = vscode.commands.registerCommand('typingpractice.startTypingPractice', () => {
        const randomWords = [
            'apple',
            'banana',
            'cherry',
            'date',
            // Add more words here
        ];

        const practiceLoop = async () => {
			showWelcomeMessage(); // Add this line to display the welcome message
            const options = await getUserOptions();

            for (let i = 0; i < options.numWords; i++) {
                typingPracticeContext.currentWord = getRandomWord(randomWords);
                typingPracticeContext.startTime = new Date().getTime();
                typingPracticeContext.totalWords++;        
                
                const userInput = await vscode.window.showInputBox({
                    placeHolder: 'Type the word...',
                    prompt: `Type this word: ${typingPracticeContext.currentWord}`,
                });

               if (userInput.toLowerCase() === 'reset') {
                        resetTypingContext();
                        vscode.window.showInformationMessage('Typing practice context has been reset.');
                        return; // Exit the loop if the user wants to reset.
                    }

                const endTime = new Date().getTime();
                const timeDiff = (endTime - typingPracticeContext.startTime) / 1000; // in seconds

                if (userInput === typingPracticeContext.currentWord) {
                    typingPracticeContext.correctWords++;
                    typingPracticeContext.totalTime += timeDiff;
                    
                    const accuracy = calculateAccuracy(typingPracticeContext.currentWord, userInput);
                    const typingSpeed = (typingPracticeContext.currentWord.length / timeDiff) * 60; // words per minute
                    
                    vscode.window.showInformationMessage(`Correct! Typing speed: ${typingSpeed.toFixed(2)} wpm, Accuracy: ${accuracy.toFixed(2)}%`);
                } else {
                    const accuracy = calculateAccuracy(typingPracticeContext.currentWord, userInput);

                    vscode.window.showErrorMessage(`Incorrect! The correct word is: ${typingPracticeContext.currentWord}, Accuracy: ${accuracy.toFixed(2)}%`);
                }
                
            }

            const averageSpeed = (typingPracticeContext.correctWords / typingPracticeContext.totalTime) * 60; // words per minute

            const userScore = typingPracticeContext.correctWords * options.wordWeight + averageSpeed * options.speedWeight;
            const leaderboard = updateLeaderboard(options.username, userScore);

            vscode.window.showInformationMessage(`Typing practice session completed. Correctly typed ${typingPracticeContext.correctWords} out of ${typingPracticeContext.totalWords} words. Average Typing Speed: ${averageSpeed.toFixed(2)} wpm. Your Score: ${userScore.toFixed(2)}`);

            displayLeaderboard(leaderboard);
            getUserFeedback();
        };

        practiceLoop();
    });

    context.subscriptions.push(disposable1);
	let disposable4 = vscode.commands.registerCommand('typingpractice.getFeedback', () => {
		getUserFeedback();
	});
	
	context.subscriptions.push(disposable4);
	let disposable5 = vscode.commands.registerCommand('typingpractice.resetTypingContext', () => {
		resetTypingContext();
		vscode.window.showInformationMessage('Typing practice context has been reset.');
	});
	
	context.subscriptions.push(disposable5);
	
}
function showWelcomeMessage() {
    vscode.window.showInformationMessage('Welcome to Typing Practice! Start practicing your typing skills now.');
}
function calculateAccuracy(original, typed) {
    if (!original || !typed) {
        return 0; // Handle the case where either original or typed is undefined or null
    }

    const minLength = Math.min(original.length, typed.length);
    let correctCount = 0;

    for (let i = 0; i < minLength; i++) {
        if (original[i] === typed[i]) {
            correctCount++;
        }
    }

    return (correctCount / original.length) * 100;
}

function getRandomWord(wordList) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}

async function getUserOptions() {
    const input = await vscode.window.showQuickPick([
        { label: 'Option 1: Easy', description: '10 words, word weight 1, speed weight 1', value: { username: 'Default User', numWords: 5, wordWeight: 1, speedWeight: 1 } },
        { label: 'Option 2: Medium', description: '10 words, word weight 1.5, speed weight 1.2', value: { username: 'Default User', numWords: 5, wordWeight: 1.5, speedWeight: 1.2 } },
        { label: 'Option 3: Hard', description: '10 words, word weight 2, speed weight 1.5', value: { username: 'Default User', numWords: 5, wordWeight: 2, speedWeight: 1.5 } },
    ], { placeHolder: 'Select your practice options' });


    if (input) {
        return input.value;
    } else {
        // Handle the case where the user canceled the input or didn't provide any input.
        vscode.window.showInformationMessage('No options provided.');
        return {
            username: 'Default User',
            numWords: 10,
            wordWeight: 1,
            speedWeight: 1,
        };
    }
}

function updateLeaderboard(username, score) {
    const leaderboard = vscode.workspace.getConfiguration().get('typingPractice.leaderboard') || [];
    leaderboard.push({ username, score });
    leaderboard.sort((a, b) => b.score - a.score);

    if (leaderboard.length > 10) {
        leaderboard.pop();
    }

    vscode.workspace.getConfiguration().update('typingPractice.leaderboard', leaderboard, vscode.ConfigurationTarget.Global);

    return leaderboard;
}

function displayLeaderboard(leaderboard) {
    let leaderboardMessage = 'Typing Practice Leaderboard:\n';

    leaderboard.forEach((entry, index) => {
        leaderboardMessage += `${index + 1}. ${entry.username}: ${entry.score.toFixed(2)}\n`;
    });

    vscode.window.showInformationMessage(leaderboardMessage);
}

function resetTypingContext() {
    typingPracticeContext.currentWord = '';
    typingPracticeContext.startTime = 0;
    typingPracticeContext.correctWords = 0;
    typingPracticeContext.totalWords = 0;
    typingPracticeContext.totalTime = 0;
}

async function getUserFeedback() {
    const feedback = await vscode.window.showInputBox({
        placeHolder: 'Provide your feedback here...',
        prompt: 'Your feedback is valuable to us!',
    });

    // You can save or process the feedback as needed, e.g., store it in a file or send it to a server.
    if (feedback) {
        // Handle the feedback, e.g., save it or send it to a server.
        vscode.window.showInformationMessage('Thank you for your feedback!');
    } else {
        vscode.window.showInformationMessage('No feedback provided.');
    }
}



// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
