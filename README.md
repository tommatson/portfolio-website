# Interactive 3D Portfolio

This is a unique and interactive portfolio website built with Next.js and Three.js. It presents a creative desktop-like interface within a 3D-rendered scene of a Mac computer model, offering a dynamic and engaging user experience.

## Features

- **3D Interactive Model**: The portfolio is presented within a 3D model of a Mac, creating a visually engaging experience.
- **Zoom-in Interaction**: On scroll, the view zooms into the Mac's screen, revealing the main portfolio content.
- **Desktop-like UI**: The portfolio is designed as a desktop interface with draggable windows for projects, experience, education, and an "about me" section.
- **Embedded Pong Game**: A fully playable Pong game is included as a fun, interactive element within the UI.
- **Rich Content Display**: The portfolio showcases detailed information about projects, work experience, and education in a structured and easily accessible format.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm (or yarn/pnpm/bun) installed on your machine.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/your_repository.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the development server
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for production
- [Three.js](https://threejs.org/) - 3D graphics library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - Icon library

## Project Structure

- `app/page.js`: The main entry point of the application, handling the 3D scene and the zoom-in interaction.
- `app/Scene.jsx`: Contains the Three.js scene, including the 3D model and lighting.
- `app/ZoomedUI.jsx`: Renders the desktop-like user interface with draggable windows and portfolio content.
- `app/Model.jsx`: The 3D model component for the Mac.
- `public/`: Contains static assets, including the 3D model (`mac-model.glb`).