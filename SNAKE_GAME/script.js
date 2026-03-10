const board = document.querySelector('.board');
const StartButton = document.querySelector('.btn-start');
const RestartButton = document.querySelector('.btn-restart');
const Modal = document.querySelector('.modal');
const StartGame = document.querySelector('.start-game');
const GameOver = document.querySelector('.game-over');

const Dscore = document.getElementById('score');
const DHscore = document.getElementById('high-score');
const Dtime = document.getElementById("time");

const blockHeight = 30;
const blockWidth = 30;

let HighestScore = Number(localStorage.getItem("HighestScore")) || 0;
DHscore.textContent = HighestScore;
let Score = 0;
let startTime = null;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let intervalID = null;
let food = {x:Math.floor(Math.random()*rows), y:Math.floor(Math.random()*cols),}

const blocks = {};
const snake = [{x:1, y:5},{x:1, y:4},{x:1, y:3}];
let direction = 'ArrowRight';

document.addEventListener("keydown", (event) => {
    if(Modal.style.display==="flex") return;

    if(event.key === "ArrowUp" && direction !== "ArrowDown")
        direction = "ArrowUp";

    else if(event.key === "ArrowDown" && direction !== "ArrowUp")
        direction = "ArrowDown";

    else if(event.key === "ArrowLeft" && direction !== "ArrowRight")
        direction = "ArrowLeft";

    else if(event.key === "ArrowRight" && direction !== "ArrowLeft")
        direction = "ArrowRight";
});


for(let row=0 ; row<rows; row++){
    for(let col=0 ; col<cols; col++){
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        blocks[`${row}-${col}`] = block
    }
}

function render() {
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('snake');
    })

    let head = null;

    if(direction === "ArrowLeft"){
        head = {x:snake[0].x, y:snake[0].y-1}
    }
    else if(direction === "ArrowRight"){
        head = {x:snake[0].x, y:snake[0].y+1}
    }
    else if(direction === "ArrowUp"){
        head = {x:snake[0].x-1, y:snake[0].y}
    }
    else if(direction === "ArrowDown"){
        head = {x:snake[0].x+1, y:snake[0].y}
    }

    if(head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols ){
        Modal.style.display = "flex";
        StartGame.style.display = "none";
        GameOver.style.display = "flex";
        clearInterval(intervalID);
        return;
    }

    // SELF COLLISION CHECK
    if (snake.slice(0,-1).some(segment => segment.x === head.x && segment.y === head.y)) {
        Modal.style.display = "flex";
        StartGame.style.display = "none";
        GameOver.style.display = "flex";
        clearInterval(intervalID);
        return;
    }

    snake.unshift(head);
    snake.pop();

    blocks[`${food.x}-${food.y}`].classList.add("food");

    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.add('snake');
    })

    if(head.x == food.x && head.y == food.y){
        blocks[`${food.x}-${food.y}`].classList.remove("food");
        do{
            food = {
                x: Math.floor(Math.random()*rows),
                y: Math.floor(Math.random()*cols)
            };
        } while(snake.some(s => s.x === food.x && s.y === food.y));

        snake.unshift(head);
        Score++;
        Dscore.textContent = Score;
        if(Score > HighestScore){
            HighestScore = Score;
            localStorage.setItem("HighestScore", HighestScore.toString());
            DHscore.textContent = HighestScore;
        }
    }
}


function startGame(){
    Modal.style.display = "none";
    if(intervalID) clearInterval(intervalID);  

    startTime = Date.now(); 
    intervalID = setInterval(() => {
        render();
        updateTimer();
    },300);
}

StartButton.addEventListener("click", () => {
    startGame();
})

function restartGame(){
    Score = 0;
    Dscore.textContent = Score;
    startTime = null;
    Dtime.textContent="00-00";

    snake.length = 0;
    snake.push({x:1,y:5},{x:1,y:4},{x:1,y:3});
    direction = "ArrowRight";
    document.querySelectorAll('.food').forEach(el=>{
        el.classList.remove('food');
    });
    do{
        food = {
            x: Math.floor(Math.random()*rows),
            y: Math.floor(Math.random()*cols)
        };
    }while(snake.some(s => s.x === food.x && s.y === food.y));

    startGame();
}

RestartButton.addEventListener("click", () => {
    restartGame();
})

function updateTimer(){
    if(!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime)/1000);
    const mins = Math.floor(elapsed/60);
    const secs = elapsed%60;
    Dtime.textContent =
        String(mins).padStart(2,'0') + "-" +
        String(secs).padStart(2,'0');
}
