'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string || formData.get('username') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function signInWithMagicLink(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    // Extract username if provided (for registration via magic link flow if unified)
    const username = formData.get('username') as string

    const options: any = {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/dashboard`,
    }

    if (username) {
        options.data = { username } // Pass username metadata so trigger can pick it up
    }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}


export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function loginWithUsername(formData: FormData) {
    const supabase = await createClient()
    
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    
    // 用户名注册时使用伪邮箱
    const pseudoEmail = `${username.toLowerCase()}@scholarly.org`
    
    const { error } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password,
    })

    if (error) {
        return { error: '用户名或密码错误' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signupWithUsername(formData: FormData) {
    const supabase = await createClient()
    
    const username = formData.get('username') as string
    const fullName = formData.get('full_name') as string
    const password = formData.get('password') as string
    
    // 用户名注册使用伪邮箱
    const pseudoEmail = `${username.toLowerCase()}@scholarly.org`
    
    const { error, data: authData } = await supabase.auth.signUp({
        email: pseudoEmail,
        password,
        options: {
            data: {
                username: username,
                full_name: fullName,
                auth_provider: 'username',
            },
        },
    })

    if (error) {
        if (error.message.includes('already registered')) {
            return { error: '该用户名已被注册' }
        }
        return { error: error.message }
    }

    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        return { error: '该用户名已被注册' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
