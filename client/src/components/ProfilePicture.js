"use client"

import { useState } from "react"
import { FaUser } from "react-icons/fa"

const ProfilePicture = ({ name, imageUrl, onImageChange }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Only allow image files
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    setIsUploading(true)

    try {
      // In a real app, you would upload the file to a server here
      // For now, we'll just create a local URL
      const reader = new FileReader()
      reader.onload = () => {
        if (onImageChange) {
          onImageChange(reader.result)
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      setIsUploading(false)
    }
  }

  return (
    <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      {imageUrl ? (
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300">
          <FaUser size={36} />
        </div>
      )}
    </div>
  )
}

export default ProfilePicture
