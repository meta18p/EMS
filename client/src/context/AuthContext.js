"use client"

import { createContext, useState, useEffect } from "react"
import axios from "axios"
import config from "../config"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem(config.tokenKey)
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const res = await axios.get(config.endpoints.verify)
          setUser(res.data)
        }
      } catch (err) {
        console.error("Auth verification failed:", err)
        localStorage.removeItem(config.tokenKey)
        delete axios.defaults.headers.common["Authorization"]
      }
      setLoading(false)
    }

    checkLoggedIn()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await axios.post(config.endpoints.login, { email, password })
      localStorage.setItem(config.tokenKey, res.data.token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
      setUser(res.data.user)
      return res.data.user
    } catch (err) {
      throw err.response?.data || { message: "Login failed. Please check your connection." }
    }
  }

  const logout = () => {
    localStorage.removeItem(config.tokenKey)
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
