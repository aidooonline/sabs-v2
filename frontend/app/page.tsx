import React from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-6">
          Welcome to Sabs v2
        </h1>
        <p className="text-xl md:text-2xl text-secondary-700 mb-8">
          Next-generation micro-finance platform for field agents and companies
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-primary-800 mb-4">
            Platform Features
          </h2>
          <ul className="text-left space-y-2 text-secondary-700">
            <li>• Multi-tenant architecture with company isolation</li>
            <li>• Role-based access control (RBAC)</li>
            <li>• Real-time transaction processing</li>
            <li>• Commission tracking and reporting</li>
            <li>• AI-powered insights and fraud detection</li>
            <li>• Omnichannel customer access</li>
          </ul>
        </div>
        <div className="mt-8 space-x-4">
          <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Get Started
          </button>
          <button className="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 font-semibold py-3 px-6 rounded-lg transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}