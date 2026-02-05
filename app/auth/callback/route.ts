import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // --- ACTUALIZACIÓN ---
  // Si Supabase nos dice a dónde ir (ej: /auth/update-password), vamos ahí.
  // Si no dice nada, vamos directo al catálogo (Tienda).
  const next = searchParams.get('next') ?? '/cliente/catalogo'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // Intercambiamos el código temporal por una sesión de usuario real
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigimos a la ruta final (Catalogo o Cambio de Contraseña)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, redirigimos a una pantalla de error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}