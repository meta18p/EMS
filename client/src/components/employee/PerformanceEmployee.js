"use client"

import { useState, useEffect, useContext } from "react"
import { FaStar, FaRegStar, FaChartLine } from "react-icons/fa"
import { SocketContext } from "../../context/SocketContext"
import { toast } from "react-toastify"

const PerformanceEmployee = ({ performance, setPerformance }) => {
  const { socket, connected } = useContext(SocketContext)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!socket || !connected) return

    // Listen for real-time performance updates
    const handlePerformanceUpdate = (updatedPerformance) => {
      setLoading(true)
      setPerformance((prevPerformance) => {
        const exists = prevPerformance.some((p) => p.id === updatedPerformance.id)
        if (exists) {
          return prevPerformance.map((p) => (p.id === updatedPerformance.id ? updatedPerformance : p))
        } else {
          return [...prevPerformance, updatedPerformance]
        }
      })
      toast.info("Your performance evaluation has been updated")
      setLoading(false)
    }

    socket.on("performance_updated", handlePerformanceUpdate)

    return () => {
      socket.off("performance_updated", handlePerformanceUpdate)
    }
  }, [socket, connected, setPerformance])

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-500" />)
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-500" />)
      }
    }
    return <div className="flex">{stars}</div>
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Performance Evaluation</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {loading && (
          <div className="text-center py-4 mb-4 bg-blue-50 rounded">
            <p className="text-blue-600">Updating your performance data...</p>
          </div>
        )}

        {performance.length > 0 ? (
          <div className="space-y-6">
            {[...performance]
              .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))
              .map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0">
                  <div className="flex items-center mb-4">
                    <FaChartLine className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Review on {new Date(review.review_date).toLocaleDateString()}</h3>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">Rating:</p>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-gray-600">({review.rating}/5)</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-700 mb-2">Feedback:</p>
                    <p className="bg-gray-50 p-3 rounded">{review.feedback}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaChartLine className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500">No performance evaluations available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceEmployee



// import { FaStar, FaRegStar, FaChartLine } from "react-icons/fa"

// const PerformanceEmployee = ({ performance }) => {
//   const renderStars = (rating) => {
//     const stars = []
//     for (let i = 1; i <= 5; i++) {
//       if (i <= rating) {
//         stars.push(<FaStar key={i} className="text-yellow-500" />)
//       } else {
//         stars.push(<FaRegStar key={i} className="text-yellow-500" />)
//       }
//     }
//     return <div className="flex">{stars}</div>
//   }

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-6">Performance Evaluation</h2>

//       <div className="bg-white rounded-lg shadow-sm border p-6">
//         {performance.length > 0 ? (
//           <div className="space-y-6">
//             {[...performance]
//               .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))
//               .map((review) => (
//                 <div key={review.id} className="border-b pb-6 last:border-0">
//                   <div className="flex items-center mb-4">
//                     <FaChartLine className="text-blue-500 mr-2" />
//                     <h3 className="font-medium">Review on {new Date(review.review_date).toLocaleDateString()}</h3>
//                   </div>

//                   <div className="mb-4">
//                     <p className="text-gray-700 mb-2">Rating:</p>
//                     <div className="flex items-center">
//                       {renderStars(review.rating)}
//                       <span className="ml-2 text-gray-600">({review.rating}/5)</span>
//                     </div>
//                   </div>

//                   <div>
//                     <p className="text-gray-700 mb-2">Feedback:</p>
//                     <p className="bg-gray-50 p-3 rounded">{review.feedback}</p>
//                   </div>
//                 </div>
//               ))}
//           </div>
//         ) : (
//           <div className="text-center py-8">
//             <FaChartLine className="text-gray-400 mx-auto mb-4" size={48} />
//             <p className="text-gray-500">No performance evaluations available yet.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default PerformanceEmployee
