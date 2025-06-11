"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Check, AlertCircle, X, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function SignatureUploader() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error" | "invalid">("idle")
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; confidence: number } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-redirect to dashboard after successful validation
  useEffect(() => {
    if (validationResult && validationResult.isValid && uploadStatus === "success") {
      setRedirecting(true)

      // Immediate redirect - no delay
      router.push(`/dashboard?valid=true&confidence=${validationResult.confidence}`)
    }
  }, [validationResult, uploadStatus, router])

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB")
      return
    }

    setFile(selectedFile)
    setErrorMessage(null)
    setValidationResult(null)
    setUploadStatus("idle")

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadStatus("idle")
    setValidationResult(null)
    setErrorMessage(null) // Clear any previous errors

    try {
      // Create a new FormData instance
      const formData = new FormData()

      // Log the file being uploaded
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      })

      // Try different field names that Flask might expect
      formData.append("file", file)
      formData.append("image", file)
      formData.append("signature", file)

      console.log("FormData created, sending request to backend...")

      // Make a direct API call to the backend using axios
      const response = await axios.post("http://localhost:5000/api/upload-signature", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Add timeout to prevent hanging requests
        timeout: 15000,
      })

      console.log("Response received from backend:", response.data)

      const result = response.data

      if (result.success) {
        // Set validation result from the response
        const validResult = {
          isValid: result.data.validationResult.isValid,
          confidence: result.data.validationResult.confidence,
        }
        setValidationResult(validResult)

        // Store the complete data for the dashboard
        sessionStorage.setItem("dashboardData", JSON.stringify(result.data))

        // Store result ID for future reference
        if (result.resultId) {
          sessionStorage.setItem("resultId", result.resultId)
        }

        // Check if the signature is valid
        if (result.data.validationResult.isValid) {
          setUploadStatus("success")

          // Prepare for redirect
          setRedirecting(true)

          // Redirect to dashboard with confidence parameter
          router.push(`/dashboard?valid=true&confidence=${result.data.validationResult.confidence}`)
        } else {
          // If not valid, show invalid status
          setUploadStatus("invalid")
          setErrorMessage("Signature validation failed. This signature appears to be invalid.")
        }
      } else {
        setUploadStatus("error")
        setErrorMessage(result.message || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)

      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        })

        setErrorMessage(`Error: ${error.message}. ${error.response?.data?.message || ""}`)
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }

      setUploadStatus("error")
    } finally {
      setIsUploading(false)
    }
  }

  // Function to test the backend connection
  const testBackendConnection = async () => {
    try {
      setErrorMessage("Testing connection to backend...")
      const response = await axios.get("http://localhost:5000/api/health", { timeout: 5000 })
      console.log("Backend connection test:", response.data)
      setErrorMessage(`Backend connection successful: ${JSON.stringify(response.data)}`)
    } catch (error) {
      console.error("Backend connection test failed:", error)
      setErrorMessage(`Backend connection failed: ${error.message}`)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreview(null)
    setUploadStatus("idle")
    setErrorMessage(null)
    setValidationResult(null)
    setRedirecting(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {uploadStatus === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-8 text-center rounded-xl shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]"
              >
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Successful!</h3>
                <p className="text-gray-600 mb-6">Your signature has been securely uploaded</p>

                <div className="relative w-full max-w-sm mb-6">
                  <div className="aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]">
                    {preview && (
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt="Signature preview"
                        fill
                        className="object-contain"
                      />
                    )}

                    {validationResult && validationResult.isValid && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          delay: 0.1,
                        }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <div
                          className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl
                            backdrop-blur-md shadow-xl border-2
                            bg-green-500/90 border-green-300 text-white"
                        >
                          <motion.div
                            initial={{ rotate: -90, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-white/20 rounded-full p-3"
                          >
                            <ShieldCheck className="h-10 w-10" />
                          </motion.div>
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-xl tracking-wide">VERIFIED</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-white/30 h-2 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${validationResult.confidence}%` }}
                                  transition={{ delay: 0.3, duration: 0.4 }}
                                  className="h-full bg-green-300"
                                />
                              </div>
                              <span className="font-bold">{validationResult.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {redirecting && (
                    <div className="flex flex-col items-center gap-2 text-purple-600">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Redirecting to dashboard...</span>
                      </div>
                      <Button
                        onClick={() =>
                          router.push(`/dashboard?valid=true&confidence=${validationResult?.confidence || 98}`)
                        }
                        className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Go to Dashboard Now
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : uploadStatus === "invalid" ? (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-8 text-center rounded-xl shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]"
              >
                <div className="rounded-full bg-red-100 p-3 mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Invalid Signature</h3>
                <p className="text-gray-600 mb-6">The signature could not be verified</p>

                <div className="relative w-full max-w-sm mb-6">
                  <div className="aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]">
                    {preview && (
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt="Signature preview"
                        fill
                        className="object-contain"
                      />
                    )}

                    {validationResult && !validationResult.isValid && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                          delay: 0.1,
                        }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <div
                          className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl
                            backdrop-blur-md shadow-xl border-2
                            bg-red-500/90 border-red-300 text-white"
                        >
                          <motion.div
                            initial={{ rotate: -90, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-white/20 rounded-full p-3"
                          >
                            <XCircle className="h-10 w-10" />
                          </motion.div>
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-xl tracking-wide">INVALID</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-white/30 h-2 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${validationResult.confidence}%` }}
                                  transition={{ delay: 0.3, duration: 0.4 }}
                                  className="h-full bg-red-300"
                                />
                              </div>
                              <span className="font-bold">{validationResult.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-600 text-sm mb-4"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                <Button onClick={resetUpload} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                  Try Another Signature
                </Button>
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!file ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-purple-500 bg-purple-50 shadow-[inset_3px_3px_6px_#d9d9d9,_inset_-3px_-3px_6px_#ffffff]"
                        : "border-gray-300 hover:border-purple-400 shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                    <motion.div
                      animate={{ y: isDragging ? -10 : 0 }}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div className="rounded-full bg-purple-100 p-3 mb-4">
                        <Upload className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Signature</h3>
                      <p className="text-gray-600 text-sm mb-2">Drag and drop or click to browse</p>
                      <p className="text-gray-500 text-xs">PNG, JPG, JPEG up to 5MB</p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow-[inset_5px_5px_10px_#d9d9d9,_inset_-5px_-5px_10px_#ffffff]">
                        {preview && (
                          <Image
                            src={preview || "/placeholder.svg"}
                            alt="Signature preview"
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                      <button
                        onClick={resetUpload}
                        className="absolute top-2 right-2 rounded-full bg-white/80 p-1 text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || !!errorMessage}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Verify Signature"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
