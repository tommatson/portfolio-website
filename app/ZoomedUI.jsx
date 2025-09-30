import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './ZoomedUI.module.css';
import { Github, Linkedin } from 'lucide-react';

// --- Pong Game Component (Self-Contained) ---
const PongGame = () => {
  const canvasRef = useRef(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const gameState = useRef({
    player: { y: 150 },
    ai: { y: 150 },
    ball: { x: 245, y: 195, dx: 3, dy: 3 },
  });
  const keysPressed = useRef({});

  const PADDLE_HEIGHT = 80;
  const PADDLE_WIDTH = 10;
  const BALL_SIZE = 10;
  const GAME_WIDTH = 500;
  const GAME_HEIGHT = 400;

  const resetBall = useCallback((scoredOn) => {
    const state = gameState.current;
    state.ball.x = GAME_WIDTH / 2 - BALL_SIZE / 2;
    state.ball.y = GAME_HEIGHT / 2 - BALL_SIZE / 2;
    state.ball.dx = 3 * (scoredOn === 'player' ? 1 : -1); // Ball moves towards the player who was scored on
    state.ball.dy = (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1);
  }, []);

  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    const state = gameState.current;

    // Player movement
    if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) {
      state.player.y = Math.max(0, state.player.y - 5);
    }
    if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) {
      state.player.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, state.player.y + 5);
    }

    // Ball movement
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;

    // Ball collision with top/bottom walls
    if (state.ball.y <= 0 || state.ball.y >= GAME_HEIGHT - BALL_SIZE) {
      state.ball.dy *= -1;
    }

    // Ball collision with paddles
    const hitPlayer = state.ball.dx < 0 && state.ball.x <= PADDLE_WIDTH && state.ball.y + BALL_SIZE >= state.player.y && state.ball.y <= state.player.y + PADDLE_HEIGHT;
    const hitAi = state.ball.dx > 0 && state.ball.x >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE && state.ball.y + BALL_SIZE >= state.ai.y && state.ball.y <= state.ai.y + PADDLE_HEIGHT;
    if (hitPlayer || hitAi) {
      state.ball.dx *= -1.05; // Increase speed on hit
    }

    // Scoring
    if (state.ball.x < -BALL_SIZE) { // AI scores
      setScores(s => ({ ...s, ai: s.ai + 1 }));
      resetBall('player');
    } else if (state.ball.x > GAME_WIDTH) { // Player scores
      setScores(s => ({ ...s, player: s.player + 1 }));
      resetBall('ai');
    }
    
    // Simple AI movement
    const aiCenter = state.ai.y + PADDLE_HEIGHT / 2;
    if (state.ball.dx > 0) {
      if (aiCenter < state.ball.y - 15) {
          state.ai.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, state.ai.y + 4);
      } else if (aiCenter > state.ball.y + 15) {
          state.ai.y = Math.max(0, state.ai.y - 4);
      }
    }

    // Update UI elements transforms for performance
    const playerPaddle = canvasRef.current.querySelector(`.${styles.pongPlayer}`);
    const aiPaddle = canvasRef.current.querySelector(`.${styles.pongAi}`);
    const ball = canvasRef.current.querySelector(`.${styles.pongBall}`);
    
    if(playerPaddle) playerPaddle.style.transform = `translateY(${state.player.y}px)`;
    if(aiPaddle) aiPaddle.style.transform = `translateY(${state.ai.y}px)`;
    if(ball) ball.style.transform = `translate(${state.ball.x}px, ${state.ball.y}px)`;

    requestAnimationFrame(gameLoop);
  }, [resetBall]);

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameLoop]);

  return (
    <div className={styles.pongView}>
      <p className={styles.pongInstructions}>Controls: W/S or Arrow Keys</p>
      <div ref={canvasRef} className={styles.pongContainer}>
        <div className={styles.pongScore}>
          <span className={styles.pongPlayerScore}>{scores.player}</span>
          <span>-</span>
          <span className={styles.pongAiScore}>{scores.ai}</span>
        </div>
        <div className={styles.pongNet}></div>
        <div className={`${styles.pongPaddle} ${styles.pongPlayer}`}></div>
        <div className={`${styles.pongPaddle} ${styles.pongAi}`}></div>
        <div className={styles.pongBall}></div>
      </div>
    </div>
  );
};


// --- Main UI Component ---
export const ZoomedUI = ({ onBack, screenCorners }) => {
  const [clipPath, setClipPath] = useState('');
  const [bounds, setBounds] = useState(null);
  const [safeArea, setSafeArea] = useState(null);
  const [windows, setWindows] = useState([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [draggedWindow, setDraggedWindow] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const safeAreaRef = useRef(null);

  useEffect(() => {
    if (screenCorners && screenCorners.length >= 3) {
      const xs = screenCorners.map(c => c.x);
      const ys = screenCorners.map(c => c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;
      setBounds({ minX, minY, width, height });

      const polygonPoints = screenCorners
        .map(corner => `${((corner.x - minX) / width) * 100}% ${((corner.y - minY) / height) * 100}%`)
        .join(', ');
      setClipPath(`polygon(${polygonPoints})`);

      const VERTICAL_PADDING_PERCENT = 0.08;
      const HORIZONTAL_PADDING_PERCENT = 0.05;
      const yTop = minY + height * VERTICAL_PADDING_PERCENT;
      const yBottom = minY + height * (1 - VERTICAL_PADDING_PERCENT);
      const topIntersections = getIntersectionsAtY(yTop, screenCorners);
      const bottomIntersections = getIntersectionsAtY(yBottom, screenCorners);

      if (topIntersections.length >= 2 && bottomIntersections.length >= 2) {
        const safeXLeftAbs = Math.max(topIntersections[0], bottomIntersections[0]);
        const safeXRightAbs = Math.min(topIntersections[topIntersections.length - 1], bottomIntersections[bottomIntersections.length - 1]);
        let safeX = safeXLeftAbs - minX;
        let safeY = yTop - minY;
        let safeWidth = safeXRightAbs - safeXLeftAbs;
        let safeHeight = yBottom - yTop;
        const horizontalPaddingAmount = safeWidth * HORIZONTAL_PADDING_PERCENT;
        safeX += horizontalPaddingAmount;
        safeWidth -= 2 * horizontalPaddingAmount;
        setSafeArea({ x: safeX, y: safeY, width: safeWidth, height: safeHeight });
      } else {
        setSafeArea(null);
      }
    }
  }, [screenCorners]);

  const portfolioData = {
    projects: [
      { id : 'proj0', title: 'Crest - AI Powered Revision', description: `I built and launched Crest from concept to a commercially successful product on the App Store. It’s a solo project that acquired a paying user base by using AI to automate exam marking and create personalized revision plans for students.

Core Impact & Features:

Commercial Success: I engineered and shipped the app's premium subscription model, converting a community of active users into a source of recurring revenue.

AI-Driven Marking & Feedback: I developed the core system allowing students to upload their exam papers for AI-powered grading and actionable feedback on their mistakes, with further features such as allowing student correction of marking practices.

Intelligent, Personalized Revision: I built the algorithm that generates custom study plans based on user specific parameters such as a user's weakest topics, past scores, schedule, and preferred learning techniques (e.g., Pomodoro, Spaced Repetition).

Technical Execution:

Backend: A high-performance, asynchronous API built with FastAPI (Python) to handle non-blocking I/O. Deployed on Railway with a PostgreSQL database.

Frontend: A stable and responsive React Native app. I implemented robust client-side architecture, including smart caching, exponential backoff, and circuit breaker patterns to ensure network resilience.

Security: The application and user data are protected with API rate limiting against brute-force attacks, strict CORS policies, and comprehensive input sanitization to prevent common vulnerabilities like XSS. I drew knowledge of my time at News UK to ensure best practices were followed.

This project demonstrates my ability to deliver a full-stack product that is technically robust, secure, and commercially viable and of a sufficient standard that clients would be willing to pay for it.`, tech: 'React Native, PostgreSQL, Railway, FastAPI' },
      { id: 'proj1', title: 'Stochastic Pair Trading Bot', description: "This project implements a stochastic AI-driven pair trading bot focused on the stocks AMAT (Applied Materials) and NXPI (NXP Semiconductors), selected based on cointegration analysis. The bot leverages two AI layers: a Gradient Boosting model and a Reinforcement Learning (RL) agent to identify and exploit arbitrage opportunities between the two securities, complete with a backtesting and live performance framework. This bot managed to return a positive ROI and was a great experience to build.", tech: 'Python, XGBoost, RL, NumPy, Pandas' },
      { id: 'proj2', title: 'Manual Image Recognition Tools', description: 'A pure-C image processing library focused on manual/hybrid content-based image recognition. Built entirely from scratch with no external dependencies, it implements core computer vision algorithms with full control and transparency.', tech: 'C, Computer Vision' },
      { id: 'proj3', title: 'Scotland Yard AI', description: "For this project I programmed an AI for the board game 'scotland yard' based on monte-carlo tree search methods. On top of this I implmeneted a custom algorithm to make the AI non-markovian in order to experiment.", tech: 'Java, OOP, AI' },
      { id: 'proj4', title: 'Multilayer Perceptron', description: 'A simple machine learning project that uses a Multi-Layer Perceptron (MLP) to recognize handwritten digits (0–9). It includes a Python-based drawing interface and C++ for the core machine learning logic. The C++ logic was programed entirely from scratch by myself (training and prediction framework), and then trained from data I pulled from the MNIST dataset.', tech: 'C++, Python, AI' },
      { id: 'proj5', title: 'Raycasting Engine', description: 'A CPU-bound raycasting engine, inspired by Wolfenstein 3D, written entirely from scratch using C++ and SDL2.', tech: 'C++' }
    ],
    experience: [
        { id: 'exp1', title: 'Work Experience at News UK', company: 'Product Security Department', period: 'Jun 2025', description: 'A week of work experience in the product security department of NewsUK. Here, I was presented with the chance to fully see how product security is implemented in a real-world setting. I was tasked with investigating the real world implications of using AI generated code in production ready environments, writing up about an assortment of models and their ability to introduce vulnerabilities in code.' },
        { id: 'exp3', title: 'Work Experience at Kaluza', company: 'Software Development', period: 'Jun 2023', description: 'A weeks worth of work experience at Kaluza. Here I conversed with many employees and team leads within their ML and software engineering departments, learning many things about the lifecycle of software development. Throughout this experience, I was tasked by the lead engineer to build a custom data pipeline, I implemented this in python, saving hours of time for the team. From this I learned valuable practises from the design reviews I recieved throughout and managed to thoroughly impress with the speed and quality of my approach.' },
        { id: 'exp4', title: 'Zero Gravity', company: 'Mentorship Program', period: '2022 - Present', description: 'Selected as a high potential candidate for a very exclusive mentoring scheme.' }
    ],
    education: [
        { id: 'edu1', title: 'University of Bristol', company: 'BSc Computer Science', period: '2024 - 2027', description: 'Pursuing a BSc in Computer Science. I love competing in hosted events such as datathons and CTFs. Achieved a high 2:1 in year one.' },
        { id: 'edu2', title: 'College of Richard Collyer', company: 'A-Levels', period: 'Graduated 2024', description: 'Successfully completed A-Level studies, providing a strong foundation for university. I acheived an A*, A, A, A in Mathematics, Further Mathematics, Computer Science, and Physics. I was in the clubs of Robotics, BEBRAS, Cybersec, table tennis and scale modelling.' },
        { id: 'edu3', title: 'Steyning', company: 'GCSE', period: 'Graduated 2022', description: 'Successfully completed GCSE studies, providing a strong foundation for A-Levels. I acheived an excellent grade average of 8.5, whilst winning awards such as the best Computer Science student, and best Physics student.' }
    ],
    trash: [
        { id: 'pong1', title: 'Pong.exe' }
    ],
    about: { name: 'Tom Matson', title: 'Computer Science Student', bio: "I am a student at the University of Bristol, pursuing a Bachelor's degree in Computer Science. I am passionate and driven, with a particular interest in artificial intelligence and quantitative development. I am especially interested in applying my skills to solve complex challenges in production-ready environments. Feel free to check out my GitHub to see some of the projects I’ve worked on so far!", contact: 'Please contact me via LinkedIn for any questions or queries, or email me at tomomatson@icloud.com' }
  };

  const handleOpenFile = (item) => {
    if (item.id === 'pong1') {
      openWindow('pong');
    }
  };
  
  const openWindow = (type, data = null) => {
    const isFolder = type === 'folder';
    const isAbout = type === 'about';
    const isPong = type === 'pong';

    const isAlreadyOpen = windows.some(w => 
      (isFolder && w.type === 'folder' && w.data.type === data.type) ||
      (isAbout && w.type === 'about') ||
      (isPong && w.type === 'pong')
    );

    if (isAlreadyOpen) {
      const windowToFront = windows.find(w => 
        (isFolder && w.type === 'folder' && w.data.type === data.type) ||
        (isAbout && w.type === 'about') ||
        (isPong && w.type === 'pong')
      );
      if (windowToFront) bringToFront(windowToFront.id);
      return;
    }

    const newWindow = { id: Date.now(), type, data, x: 50 + windows.length * 20, y: 80 + windows.length * 20, zIndex: nextZIndex };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  const closeWindow = (id) => setWindows(windows.filter(w => w.id !== id));

  const bringToFront = (id) => {
    setWindows(windows.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w));
    setNextZIndex(nextZIndex + 1);
  };

  const startDrag = (e, windowId) => {
    const windowState = windows.find(w => w.id === windowId);
    if (!windowState || !safeAreaRef.current) return;
    const containerRect = safeAreaRef.current.getBoundingClientRect();
    setDraggedWindow(windowId);
    setDragOffset({ x: e.clientX - containerRect.left - windowState.x, y: e.clientY - containerRect.top - windowState.y });
    bringToFront(windowId);
  };

  const handleMouseMove = (e) => {
    if (draggedWindow !== null && safeAreaRef.current) {
      const containerRect = safeAreaRef.current.getBoundingClientRect();
      const windowElement = document.querySelector(`[data-id='${draggedWindow}']`);
      const windowWidth = windowElement ? windowElement.offsetWidth : 300;
      const windowHeight = windowElement ? windowElement.offsetHeight : 200;
      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;
      newX = Math.max(0, Math.min(newX, containerRect.width - windowWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - windowHeight));
      setWindows(windows.map(w => w.id === draggedWindow ? { ...w, x: newX, y: newY } : w));
    }
  };

  const handleMouseUp = () => setDraggedWindow(null);

  if (!bounds) return null;

  const getWindowTitle = (window) => {
    switch (window.type) {
        case 'folder': return window.data.title;
        case 'about': return 'About Me';
        case 'pong': return 'Pong';
        default: return 'Window';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.screenOverlay} style={{ left: `${bounds.minX}px`, top: `${bounds.minY}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, clipPath, WebkitClipPath: clipPath }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {safeArea && (
          <div ref={safeAreaRef} className={styles.safeArea} style={{ left: `${safeArea.x}px`, top: `${safeArea.y}px`, width: `${safeArea.width}px`, height: `${safeArea.height}px` }} onMouseMove={handleMouseMove}>
            <div className={styles.macOS}>
              <div className={styles.menuBar}>
                <div className={`${styles.menuItem} ${styles.nonClickable}`}><span className={styles.appleIcon}>tommatson</span></div>
                <div className={styles.menuItem}><a href="https://github.com/tommatson" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github size={16} /></a></div>
                <div className={styles.menuItem}><a href="https://www.linkedin.com/in/tom-matson-4739b0279/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a></div>
                <div className={styles.menuBarRight}><button onClick={onBack} className={styles.menuButton}>Exit</button></div>
              </div>

              <div className={styles.desktop}>
                <div className={styles.desktopIcons}>
                  <div className={styles.icon} onClick={() => openWindow('folder', { type: 'projects', title: 'Projects' })}>
                    <div className={styles.iconImage}>📁</div>
                    <div className={styles.iconLabel}>Projects</div>
                  </div>
                  <div className={styles.icon} onClick={() => openWindow('folder', { type: 'experience', title: 'Experience' })}>
                    <div className={styles.iconImage}>💼</div>
                    <div className={styles.iconLabel}>Experience</div>
                  </div>
                   <div className={styles.icon} onClick={() => openWindow('folder', { type: 'education', title: 'Education' })}>
                    <div className={styles.iconImage}>🎓</div>
                    <div className={styles.iconLabel}>Education</div>
                  </div>
                  <div className={styles.icon} onClick={() => openWindow('about')}>
                    <div className={styles.iconImage}>👤</div>
                    <div className={styles.iconLabel}>About Me</div>
                  </div>
                   <div className={styles.icon} onClick={() => openWindow('folder', { type: 'trash', title: 'Trash' })}>
                    <div className={styles.iconImage}>🗑️</div>
                    <div className={styles.iconLabel}>Trash</div>
                  </div>
                </div>

                {windows.map(window => (
                  <div key={window.id} data-id={window.id} className={styles.window} style={{ left: `${window.x}px`, top: `${window.y}px`, zIndex: window.zIndex }} onMouseDown={() => bringToFront(window.id)}>
                    <div className={styles.titleBar} onMouseDown={(e) => startDrag(e, window.id)}>
                      <div className={styles.titleBarButtons}>
                        <button className={styles.closeButton} onMouseDown={(e) => e.stopPropagation()} onClick={() => closeWindow(window.id)}>×</button>
                      </div>
                      <div className={styles.titleBarText}>{getWindowTitle(window)}</div>
                    </div>
                    <div className={styles.windowContent}>
                      {window.type === 'folder' && portfolioData[window.data.type] && (
                        <div className={styles.folderView}>
                          {portfolioData[window.data.type].map((item) => (
                             <div key={item.id} className={styles.itemView} onClick={item.id === 'pong1' ? () => handleOpenFile(item) : null}>
                                {item.id === 'pong1' ? (
                                    <div className={styles.fileItem}>
                                        <span className={styles.fileIcon}>👾</span>
                                        <span className={styles.fileName}>{item.title}</span>
                                    </div>
                                ) : (
                                    <>
                                        <h3>{item.title}</h3>
                                        {item.company && (<p className={styles.company}><strong>{item.company}</strong> • {item.period}</p>)}
                                        <p className={styles.description}>{item.description}</p>
                                        {item.tech && (<p className={styles.tech}><strong>Technologies:</strong> {item.tech}</p>)}
                                    </>
                                )}
                             </div>
                          ))}
                        </div>
                      )}
                      {window.type === 'about' && (
                        <div className={styles.aboutView}>
                          <h2>{portfolioData.about.name}</h2>
                          <h3>{portfolioData.about.title}</h3>
                          <p className={styles.bio}>{portfolioData.about.bio}</p>
                          <div className={styles.aboutSection}><strong>Contact:</strong><p>{portfolioData.about.contact}</p></div>
                        </div>
                      )}
                      {window.type === 'pong' && <PongGame />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to find the polygon's horizontal intersections at a given Y-coordinate
const getIntersectionsAtY = (y, corners) => {
  const intersections = [];
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
      if (p2.y - p1.y !== 0) {
        const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
        intersections.push(x);
      }
    }
  }
  return intersections.sort((a, b) => a - b);
};