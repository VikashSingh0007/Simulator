import React from 'react'

function Card({ test, obj }) {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4 border border-gray-200">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-gray-800">
          {test || "Card Title"}
        </div>
        {obj && obj.name && (
          <p className="text-gray-700 text-base">
            Name: <span className="font-semibold text-blue-600">{obj.name}</span>
          </p>
        )}
        {obj && obj.age && (
          <p className="text-gray-700 text-base">
            Age: <span className="font-semibold text-blue-600">{obj.age}</span>
          </p>
        )}
      </div>
      <div className="px-6 pt-4 pb-2">
        <span className="inline-block bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2 mb-2">#react</span>
        <span className="inline-block bg-purple-100 rounded-full px-3 py-1 text-sm font-semibold text-purple-700 mr-2 mb-2">#tailwind</span>
      </div>
    </div>
  )
}

export default Card
