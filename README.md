# Taskmaster UI

A modern, web-based interface for [Task Master](https://github.com/eyaltoledano/claude-task-master) with kanban board functionality. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

- 🎯 **Visual Task Management** - Intuitive kanban board interface
- 🎨 **Drag & Drop** - Move tasks between different states seamlessly
- 🌙 **Dark/Light Mode** - Toggle between themes with system preference support
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - File system watcher for tasks.json changes
- 🔍 **Search & Filter** - Find tasks quickly with advanced filtering
- 📊 **Analytics View** - Visualize task progress and metrics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Task Master](https://github.com/eyaltoledano/claude-task-master) installed and initialized in your project

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd taskmaster-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal)

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **File Watching**: Chokidar
- **Real-time**: Socket.io

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── layout/         # Layout components (Sidebar, TopNav, etc.)
│   ├── ui/            # Reusable UI components
│   └── kanban/        # Kanban board specific components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── providers/         # Context providers (Theme, etc.)
├── stores/            # Zustand stores
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📋 Current Progress

### ✅ Completed Tasks

1. **Setup Next.js Project with TypeScript** - Complete project scaffolding with all necessary dependencies
2. **Implement Basic UI Layout Structure** - Responsive layout with sidebar, top navigation, and main content area

### 🚧 In Progress

3. **Setup State Management with Zustand** - Global state management for tasks and UI state

### 📝 Upcoming Tasks

4. Implement File System Watcher for tasks.json
5. Create Task Data Models and API
6. Implement Kanban Board View
7. Add Task Card Components
8. Implement Drag and Drop Functionality
9. Add Task Creation/Editing
10. Implement Task Filtering and Search
11. Add Real-time Updates with WebSocket
12. Create List View Component
13. Implement Task Status Management
14. Add Task Dependencies Visualization
15. Create Analytics Dashboard
16. Add Export/Import Functionality
17. Implement User Preferences
18. Add Keyboard Shortcuts
19. Create Mobile-Responsive Design
20. Add Comprehensive Testing

## 🎨 UI Components

### Layout Components
- **AppLayout** - Main application layout container
- **Sidebar** - Collapsible navigation sidebar with project selector
- **TopNav** - Top navigation with search, view switcher, and theme toggle
- **MainContent** - Content area container

### Theme Support
- System preference detection
- Manual light/dark mode toggle
- Persistent theme selection
- CSS custom properties for theming

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Task Master](https://github.com/eyaltoledano/claude-task-master) - The CLI tool this UI wraps
- [Claude](https://claude.ai) - AI assistant that powers Task Master

## 📞 Support

If you have any questions or need help, please:
1. Check the [Task Master documentation](https://github.com/eyaltoledano/claude-task-master)
2. Open an issue on GitHub
3. Join our community discussions 