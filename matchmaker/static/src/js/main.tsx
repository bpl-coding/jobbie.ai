import 'vite/modulepreload-polyfill';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom';
import { resumeApi } from './store/resumeApi'
import './index.css'
import { ApiProvider } from '@reduxjs/toolkit/dist/query/react'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApiProvider api={resumeApi}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApiProvider>
  </React.StrictMode>
)
