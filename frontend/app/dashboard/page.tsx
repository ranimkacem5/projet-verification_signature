"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileJson, FileSpreadsheet, FileIcon as FilePdf, ChevronDown } from "lucide-react"
import axios from "axios"

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  // Get validation data from URL params
  const isValidParam = searchParams.get("valid")
  const confidenceParam = searchParams.get("confidence")

  const isValid = isValidParam === "true"
  const confidence = confidenceParam ? Number.parseInt(confidenceParam, 10) : 98

  // Confusion matrix data
  const [confusionMatrix, setConfusionMatrix] = useState({
    truePositives: 0,
    falsePositives: 0,
    trueNegatives: 0,
    falseNegatives: 0,
  })

  // Metrics
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  })

  // Error state
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to get data from sessionStorage first
    const storedData = sessionStorage.getItem("dashboardData")
    const resultId = sessionStorage.getItem("resultId")

    if (storedData) {
      try {
        const data = JSON.parse(storedData)
        setConfusionMatrix(data.confusionMatrix)
        setMetrics(data.metrics)
        setLoading(false)
      } catch (error) {
        console.error("Error parsing stored dashboard data:", error)
        // If parsing fails, try to fetch from API
        if (resultId) {
          fetchResultData(resultId)
        } else {
          setError("No result ID found. Please upload a signature first.")
          setLoading(false)
        }
      }
    } else if (resultId) {
      // If no stored data but we have a result ID, fetch from API
      fetchResultData(resultId)
    } else {
      setError("No data available. Please upload a signature first.")
      setLoading(false)
    }
  }, [])

  const fetchResultData = async (resultId: string) => {
    try {
      setLoading(true)
      console.log("Fetching result data from backend for ID:", resultId)

      // Fetch result data from backend using Axios directly
      const response = await axios.get(`http://localhost:5000/api/result/${resultId}`)
      console.log("Result data received:", response.data)

      const result = response.data

      if (result.success && result.data) {
        // Set confusion matrix from API data
        setConfusionMatrix(result.data.confusionMatrix)
        // Set metrics from API data
        setMetrics(result.data.metrics)
      } else {
        setError("Failed to load data from the server.")
      }
    } catch (error) {
      console.error("Error fetching result data:", error)

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        })

        setError(`Error connecting to the server: ${error.message}`)
      } else {
        setError("Error connecting to the server. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.push("/")
  }

  // Function to export data as JSON
  const exportAsJSON = async () => {
    try {
      const resultId = sessionStorage.getItem("resultId")
      if (!resultId) {
        alert("No result ID found. Please upload a signature first.")
        return
      }

      console.log("Exporting JSON data for result ID:", resultId)

      // Get fresh data from API
      const response = await axios.get(`http://localhost:5000/api/export`, {
        params: {
          format: "json",
          result_id: resultId,
        },
      })

      console.log("Export data received:", response.data)

      // Convert to JSON string
      const jsonString = JSON.stringify(response.data, null, 2)

      // Create a blob and download
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "signature-analysis.json"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting JSON:", error)

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        })

        alert(`Failed to export JSON: ${error.message}`)
      } else {
        alert("Failed to export JSON. Please try again.")
      }
    }
  }

  // Function to export data as CSV
  const exportAsCSV = async () => {
    try {
      const resultId = sessionStorage.getItem("resultId")
      if (!resultId) {
        alert("No result ID found. Please upload a signature first.")
        return
      }

      console.log("Exporting CSV data for result ID:", resultId)

      // Get CSV directly from API
      const response = await axios.get(`http://localhost:5000/api/export`, {
        params: {
          format: "csv",
          result_id: resultId,
        },
        responseType: "text",
      })

      console.log("CSV data received, length:", response.data.length)

      // Create a download link for the CSV
      const blob = new Blob([response.data], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "signature-analysis.csv"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        })

        alert(`Failed to export CSV: ${error.message}`)
      } else {
        alert("Failed to export CSV. Please try again.")
      }
    }
  }

  // Function to export data as PDF
  const exportAsPDF = async () => {
    try {
      const resultId = sessionStorage.getItem("resultId")
      if (!resultId) {
        alert("No result ID found. Please upload a signature first.")
        return
      }

      console.log("Exporting PDF data for result ID:", resultId)

      // Try to get PDF from API if supported
      try {
        const response = await axios.get(`http://localhost:5000/api/export`, {
          params: {
            format: "pdf",
            result_id: resultId,
          },
          responseType: "blob",
        })

        console.log("PDF data received, size:", response.data.size)

        // Create a download link for the PDF
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "signature-analysis.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return
      } catch (error) {
        console.warn("PDF export from API not supported, falling back to browser print:", error)
        // Fall back to browser print if API doesn't support PDF
      }

      // Create a simple HTML version for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        alert("Please allow popups to export PDF")
        return
      }

      // Create HTML content
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Signature Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { text-align: center; margin-bottom: 30px; }
          h2 { margin-top: 30px; color: #6d28d9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 12px; text-align: left; }
          th { background-color: #f8f8f8; }
          .metrics { display: flex; flex-wrap: wrap; }
          .metric { width: 50%; padding: 10px 0; }
          .footer { margin-top: 50px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Signature Analysis Report</h1>
        
        <h2>Validation Result</h2>
        <p>Status: <strong style="color: ${isValid ? "green" : "red"}">
          ${isValid ? "Verified" : "Invalid"}</strong> (${confidence}% confidence)
        </p>
        
        <h2>Confusion Matrix</h2>
        <table>
          <tr>
            <th></th>
            <th>Predicted Positive</th>
            <th>Predicted Negative</th>
          </tr>
          <tr>
            <th>Actual Positive</th>
            <td>${confusionMatrix.truePositives}</td>
            <td>${confusionMatrix.falseNegatives}</td>
          </tr>
          <tr>
            <th>Actual Negative</th>
            <td>${confusionMatrix.falsePositives}</td>
            <td>${confusionMatrix.trueNegatives}</td>
          </tr>
        </table>
        
        <h2>Performance Metrics</h2>
        <div class="metrics">
          <div class="metric">
            <p><strong>Accuracy:</strong> ${(metrics.accuracy * 100).toFixed(1)}%</p>
            <p><em>Formula: (TP + TN) / (TP + TN + FP + FN)</em></p>
          </div>
          <div class="metric">
            <p><strong>Precision:</strong> ${(metrics.precision * 100).toFixed(1)}%</p>
            <p><em>Formula: TP / (TP + FP)</em></p>
          </div>
          <div class="metric">
            <p><strong>Recall:</strong> ${(metrics.recall * 100).toFixed(1)}%</p>
            <p><em>Formula: TP / (TP + FN)</em></p>
          </div>
          <div class="metric">
            <p><strong>F1 Score:</strong> ${metrics.f1Score.toFixed(2)}</p>
            <p><em>Formula: 2 * (Precision * Recall) / (Precision + Recall)</em></p>
          </div>
        </div>
        
        <h2>Definitions</h2>
        <p><strong>True Positive (TP):</strong> Correctly identified as positive</p>
        <p><strong>False Positive (FP):</strong> Incorrectly identified as positive</p>
        <p><strong>True Negative (TN):</strong> Correctly identified as negative</p>
        <p><strong>False Negative (FN):</strong> Incorrectly identified as negative</p>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Signature Verification System</p>
        </div>
        
        <script>
          // Auto print when loaded
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)

      printWindow.document.close()
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to export PDF. Please try again.")
    }
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-gray-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={goBack} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Go Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" className="flex items-center gap-2" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Verifier
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Signature Analysis Dashboard</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Report
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={exportAsJSON}>
                <FileJson className="h-4 w-4" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={exportAsCSV}>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={exportAsPDF}>
                <FilePdf className="h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-400">Loading data...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-700">Validation Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    Verified
                    <span className="text-lg font-normal text-gray-500 ml-2">({confidence}%)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-700">Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{`${(metrics.accuracy * 100).toFixed(1)}%`}</div>
                  <div className="text-sm text-gray-500 mt-1">Overall model performance</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gray-700">F1 Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{metrics.f1Score.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mt-1">Harmonic mean of precision and recall</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-medium text-gray-700">Confusion Matrix</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            A confusion matrix shows the performance of the classification model. It compares predicted
                            values with actual values.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div className="text-right pr-2 font-medium text-gray-500"></div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-center font-medium text-gray-500">Predicted Positive</div>
                        <div className="text-center font-medium text-gray-500">Predicted Negative</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div className="text-right pr-2 font-medium text-gray-500">Actual Positive</div>
                      <div className="grid grid-cols-2 gap-1">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          whileHover={{
                            scale: 1.05,
                            y: -5,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            transition: { duration: 0.2 },
                          }}
                          className="bg-green-100 border border-green-200 rounded-md p-4 text-center"
                        >
                          <div className="text-xl font-bold text-green-700">{confusionMatrix.truePositives}</div>
                          <div className="text-xs text-green-600">True Positive</div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          whileHover={{
                            scale: 1.05,
                            y: -5,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            transition: { duration: 0.2 },
                          }}
                          className="bg-red-100 border border-red-200 rounded-md p-4 text-center"
                        >
                          <div className="text-xl font-bold text-red-700">{confusionMatrix.falseNegatives}</div>
                          <div className="text-xs text-red-600">False Negative</div>
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-right pr-2 font-medium text-gray-500">Actual Negative</div>
                      <div className="grid grid-cols-2 gap-1">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{
                            scale: 1.05,
                            y: -5,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            transition: { duration: 0.2 },
                          }}
                          className="bg-red-100 border border-red-200 rounded-md p-4 text-center"
                        >
                          <div className="text-xl font-bold text-red-700">{confusionMatrix.falsePositives}</div>
                          <div className="text-xs text-red-600">False Positive</div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{
                            scale: 1.05,
                            y: -5,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            transition: { duration: 0.2 },
                          }}
                          className="bg-green-100 border border-green-200 rounded-md p-4 text-center"
                        >
                          <div className="text-xl font-bold text-green-700">{confusionMatrix.trueNegatives}</div>
                          <div className="text-xs text-green-600">True Negative</div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-medium text-gray-700">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Accuracy */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">Accuracy</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-3 w-3" />
                                  <span className="sr-only">Info</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">(TP + TN) / (TP + TN + FP + FN)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-bold text-gray-800">{(metrics.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.accuracy * 100}%` }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          className="bg-purple-600 h-2 rounded-full relative group-hover:bg-purple-500 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Precision */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">Precision</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-3 w-3" />
                                  <span className="sr-only">Info</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">TP / (TP + FP)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-bold text-gray-800">{(metrics.precision * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.precision * 100}%` }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="bg-purple-600 h-2 rounded-full relative group-hover:bg-purple-500 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Recall */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">Recall</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-3 w-3" />
                                  <span className="sr-only">Info</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">TP / (TP + FN)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-bold text-gray-800">{(metrics.recall * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.recall * 100}%` }}
                          transition={{ delay: 0.7, duration: 0.8 }}
                          className="bg-purple-600 h-2 rounded-full relative group-hover:bg-purple-500 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </motion.div>
                      </div>
                    </div>

                    {/* F1 Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">F1 Score</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-3 w-3" />
                                  <span className="sr-only">Info</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">2 * (Precision * Recall) / (Precision + Recall)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-bold text-gray-800">{metrics.f1Score.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden group">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metrics.f1Score * 100}%` }}
                          transition={{ delay: 0.8, duration: 0.8 }}
                          className="bg-purple-600 h-2 rounded-full relative group-hover:bg-purple-500 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-100 border-none shadow-[5px_5px_10px_#d9d9d9,_-5px_-5px_10px_#ffffff] rounded-xl mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-700">Formulas & Definitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Confusion Matrix Terms</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">True Positive (TP):</span> Correctly identified as positive
                      </li>
                      <li>
                        <span className="font-medium">False Positive (FP):</span> Incorrectly identified as positive
                      </li>
                      <li>
                        <span className="font-medium">True Negative (TN):</span> Correctly identified as negative
                      </li>
                      <li>
                        <span className="font-medium">False Negative (FN):</span> Incorrectly identified as negative
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Performance Metrics</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">Accuracy:</span> (TP + TN) / (TP + TN + FP + FN)
                      </li>
                      <li>
                        <span className="font-medium">Precision:</span> TP / (TP + FP)
                      </li>
                      <li>
                        <span className="font-medium">Recall:</span> TP / (TP + FN)
                      </li>
                      <li>
                        <span className="font-medium">F1 Score:</span> 2 * (Precision * Recall) / (Precision + Recall)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
