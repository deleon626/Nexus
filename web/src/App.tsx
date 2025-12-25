import './App.css'
import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ApprovalQueue from './pages/ApprovalQueue'
import { DataEntry } from './pages/DataEntry'
import { SchemaGenerator } from './pages/SchemaGenerator'
import { IDRuleConfig } from './pages/IDRuleConfig'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  React.useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-lg font-semibold">Nexus QC</Link>
              <Link
                to="/data-entry"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Data Entry
              </Link>
              <Link
                to="/approval-queue"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Approval Queue
              </Link>
              <Link
                to="/schema-generator"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Schema Generator
              </Link>
              <Link
                to="/id-rules"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ID Rules
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<DataEntry />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/approval-queue" element={<ApprovalQueue />} />
            <Route path="/schema-generator" element={<SchemaGenerator />} />
            <Route path="/id-rules" element={<IDRuleConfig />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
