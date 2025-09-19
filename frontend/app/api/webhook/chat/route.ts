import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Debug logging
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('BACKEND_SERVICE_URL:', process.env.BACKEND_SERVICE_URL)
    
    // Get backend URL - use BACKEND_SERVICE_URL for server-side requests
    const backendUrl = process.env.BACKEND_SERVICE_URL || 'http://localhost:5000'
    
    console.log(`Forwarding chat request to: ${backendUrl}/api/webhook/chat`)
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const response = await fetch(`${backendUrl}/api/webhook/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log(`Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Backend error response: ${errorText}`)
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Backend response data:', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in chat webhook:', error)
    return NextResponse.json(
      { 
        reply: "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
