export default function LoadingSpinner() {
    return (
      <div className="flex justify-center items-center h-[50%] gap-2">
        <p>Imagining...</p>
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }