import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Tokens ausentes' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.headers
            .get('cookie')
            ?.split('; ')
            .find(c => c.startsWith(name + '='))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return response
}
