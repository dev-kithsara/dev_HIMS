import { useState } from "react"
import FileUpload from "./FileUpload"
import { createIncident } from "../services/incident.api"

const IncidentForm = () => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    const formData = new FormData()

    formData.append("title", title)
    formData.append("description", description)
    formData.append("severity", severity)
    formData.append("category", category)
    formData.append("location", location)
    formData.append("departmentId", departmentId)

    files.forEach((file) => {
      formData.append("evidence", file)
    })

    try {
      const response = await createIncident(formData)

      console.log(response)

      setSuccessMessage("Incident submitted successfully!")

      // reset form
      setTitle("")
      setDescription("")
      setSeverity("")
      setCategory("")
      setLocation("")
      setDepartmentId("")
      setFiles([])
    } catch (error) {
      console.error(error)

      setErrorMessage("Failed to submit incident. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
      min-h-screen
      bg-gradient-to-br
      from-blue-50
      to-cyan-100
      flex
      justify-center
      pt-10
      p-6
      "
    >
      <form
        onSubmit={handleSubmit}
        className="
        w-full
        max-w-2xl
        bg-white/80
        backdrop-blur-xl
        shadow-2xl
        rounded-3xl
        p-8
        "
      >
        <h2
          className="
          text-3xl
          font-bold
          text-gray-800
          text-center
          "
        >
          Report New Incident
        </h2>

        <p className="text-center text-gray-500 mt-2 mb-6">Submit healthcare incidents and attach evidence</p>

        {successMessage && (
          <div
            className="
            bg-green-100
            text-green-700
            p-3
            rounded-xl
            mb-5
            text-center
            "
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            className="
            bg-red-100
            text-red-700
            p-3
            rounded-xl
            mb-5
            text-center
            "
          >
            {errorMessage}
          </div>
        )}

        <label className="block mb-2 font-medium">Incident Title</label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="
          w-full
          p-3
          mb-5
          rounded-xl
          border
          "
          placeholder="Enter incident title"
        />

        <label className="block mb-2 font-medium">Description</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="
          w-full
          p-3
          mb-5
          rounded-xl
          border
          "
          placeholder="Describe the incident"
        />

        <label className="block mb-2 font-medium">Severity</label>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="
          w-full
          p-3
          mb-5
          rounded-xl
          border
          "
        >
          <option value="">Select Severity</option>

          <option value="LOW">LOW</option>

          <option value="MEDIUM">MEDIUM</option>

          <option value="HIGH">HIGH</option>

          <option value="CRITICAL">CRITICAL</option>
        </select>

        <div
          className="
        grid
        grid-cols-1
        md:grid-cols-2
        gap-5
        "
        >
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="
            p-3
            rounded-xl
            border
            "
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="
            p-3
            rounded-xl
            border
            "
          />
        </div>

        <input
          type="number"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          placeholder="Department ID"
          className="
          w-full
          p-3
          mt-5
          mb-5
          rounded-xl
          border
          "
        />

        <div
          className="
        bg-gray-50
        p-4
        rounded-xl
        border-dashed
        border
        mb-6
        "
        >
          <FileUpload onFilesChange={setFiles} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
          w-full
          py-3
          rounded-xl
          text-white
          font-semibold
          text-lg
          transition
          ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading ? "Submitting..." : "Submit Incident"}
        </button>
      </form>
    </div>
  )
}

export default IncidentForm
