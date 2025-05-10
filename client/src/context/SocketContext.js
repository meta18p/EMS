"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { AuthContext } from "./AuthContext"
import config from "../config"

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useContext(AuthContext)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(config.apiUrl, {
      transports: ["websocket"],
      autoConnect: false,
    })

    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    // Connect and join rooms when user is authenticated
    if (user) {
      socket.connect()

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id)
        setConnected(true)

        // Join user-specific and role-specific rooms
        socket.emit("join", user)
      })

      socket.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err)
        setConnected(false)
      })
    } else {
      // Disconnect when user logs out
      if (socket.connected) {
        socket.disconnect()
        setConnected(false)
      }
    }

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
    }
  }, [socket, user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
