# 🎓 Teaching Platform

A modern, feature-rich online learning platform built with Next.js, designed to deliver seamless educational experiences with real-time collaboration and interactive content.

**[Live Demo](https://teaching-platform-beige.vercel.app)** | **[GitHub](https://github.com/Shabbin/teaching-platform)**

---

## ✨ Features

- 🎥 **Video Conferencing** - Real-time video sessions with Daily.co integration
- 💬 **Real-time Chat** - Stream Chat messaging for instant communication
- 📝 **Rich Text Editor** - React Quill for creating and editing course content
- 🎨 **Modern UI** - Material-UI and Tailwind CSS for beautiful interfaces
- 📱 **Responsive Design** - Fully mobile-optimized experience
- 🔄 **State Management** - Redux Toolkit for predictable state handling
- 🎭 **Animation & Motion** - Framer Motion for smooth, engaging interactions
- 🗂️ **Form Handling** - React Hook Form with Zod validation
- ⚡ **Real-time Syncing** - Socket.io for live updates
- 🔐 **Type Safety** - Full TypeScript support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended 20+)
- **npm** or **yarn** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Shabbin/teaching-platform.git
cd teaching-platform

# Install dependencies
npm install
# or
yarn install
```

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will hot-reload as you make changes to files.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 📚 Tech Stack

### Frontend Framework & Build
- **Next.js 16.1.3** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5.9.3** - Type safety

### Styling & UI Components
- **Tailwind CSS 4.1.18** - Utility-first CSS
- **Material-UI 7.3.7** - Component library
- **Emotion** - CSS-in-JS styling
- **Framer Motion 12.26.2** - Animation library
- **DaisyUI 5.5.14** - Tailwind component library
- **Lucide React** - Icon library
- **React Icons 5.5.0** - Additional icons

### Form & State Management
- **React Hook Form 7.71.1** - Efficient form handling
- **Zod 3.25.74** - Schema validation
- **Redux Toolkit 2.11.2** - State management
- **Redux Persist 6.0.0** - State persistence
- **XState 5.25.1** - State machine implementation

### Real-time & Communication
- **Daily.co SDK 0.84.0** - Video conferencing
- **Stream Chat SDK 9.28.0** - Messaging platform
- **Socket.io Client 4.8.3** - WebSocket communication

### Data & API
- **TanStack Query 5.90.19** - Data fetching & caching
- **Axios 1.13.2** - HTTP client
- **Date-fns 4.1.0** - Date manipulation

### Content & Code
- **React Quill New 3.7.0** - Rich text editor
- **PrismJS 1.30.0** - Syntax highlighting
- **React Loading Skeleton 3.5.0** - Loading states

### UI Utilities
- **React Select 5.10.2** - Select component
- **React Hot Toast 2.6.0** - Toast notifications
- **Isomorphic DOMPurify 2.35.0** - XSS protection

### Development Tools
- **ESLint 9** - Code linting
- **Autoprefixer** - CSS vendor prefixes
- **PostCSS** - CSS processing

---

## 📁 Project Structure

```
teaching-platform/
├── src/                    # Source code directory
├── public/                 # Static assets
├── components.json         # shadcn/ui configuration
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
├── package.json            # Project dependencies
└── README.md              # This file
```

---

## 🔧 Configuration Files

- **`next.config.js`** - Next.js build and runtime configuration
- **`tsconfig.json`** - TypeScript compiler options
- **`tailwind.config.js`** - Tailwind CSS customization
- **`postcss.config.mjs`** - PostCSS plugin configuration
- **`.eslintrc`** - ESLint rules and configuration

---

## 🌐 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy this Next.js application is using **[Vercel Platform](https://vercel.com)**.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The platform is optimized for Vercel deployment with automatic builds and previews.

### Environment Variables

Create a `.env.local` file in the root directory with required environment variables:

```env
NEXT_PUBLIC_API_URL=your_api_url
# Add other required environment variables here
```

---

## 📦 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start development server |
| Build | `npm run build` | Create optimized production build |
| Start | `npm start` | Run production server |
| Lint | `npm run lint` | Run ESLint checks |

---

## 🎯 Key Capabilities

### Education Features
- **Course Management** - Create and organize courses
- **Live Sessions** - Conduct real-time video classes with students
- **Instant Messaging** - Direct communication between instructors and learners
- **Rich Content** - Support for text, code, and multimedia content
- **Real-time Notifications** - Keep users updated with Socket.io

### Developer Experience
- **Type-Safe** - Full TypeScript coverage
- **Hot Reload** - Instant feedback during development
- **Form Validation** - Zod schemas for runtime validation
- **Optimized Bundles** - Next.js automatic code splitting
- **ESLint Configured** - Code quality enforcement

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting:

```bash
npm run lint
```

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Shabbin** - [GitHub Profile](https://github.com/Shabbin)

---

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com)
- [Redux Toolkit Guide](https://redux-toolkit.js.org)
- [Socket.io Documentation](https://socket.io/docs)

---

## 📮 Support

For issues and questions:
- Open an [Issue](https://github.com/Shabbin/teaching-platform/issues)
- Check existing discussions in the repository

---

<div align="center">

Made with ❤️ by **Shabbin**

⭐ If you find this helpful, please consider giving it a star!

</div>
