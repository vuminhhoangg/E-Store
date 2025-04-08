import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'

// Cấu hình global Axios
axios.defaults.baseURL = 'http://localhost:8080'
axios.interceptors.request.use((config) => {
  console.log('Global Axios Request:', config.method?.toUpperCase(), config.url)
  return config
}, (error) => {
  console.error('Global Axios Request Error:', error)
  return Promise.reject(error)
})

axios.interceptors.response.use((response) => {
  console.log('Global Axios Response:', response.status, response.config.url)
  return response
}, (error) => {
  console.error('Global Axios Response Error:', error.message, {
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data
  })
  return Promise.reject(error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </React.StrictMode>,
)
