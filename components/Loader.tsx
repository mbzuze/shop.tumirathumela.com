function Loader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500 border-solid"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
}
export default Loader;