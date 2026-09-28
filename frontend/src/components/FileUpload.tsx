import { useState } from "react"

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
}

const FileUpload = ({ onFilesChange }: FileUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      setSelectedFiles(filesArray)

      onFilesChange(filesArray)
    }
  }

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-2">Upload Evidence</label>

      <input
        type="file"
        multiple
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleFileChange}
        className="
          w-full
          border
          border-gray-300
          rounded-xl
          p-3
        "
      />

      {selectedFiles.length > 0 && (
        <div className="mt-3">
          <p className="font-medium">Selected Files:</p>

          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FileUpload
