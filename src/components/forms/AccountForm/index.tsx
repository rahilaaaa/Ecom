'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Media } from '@/components/Media'
import type { Media as MediaType, User } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormData = {
  email: string
  name: User['name']
  password: string
  passwordConfirm: string
}

const inputClassName =
  'min-h-12 w-full rounded-md border border-[var(--elixir-outline-variant,#c4c7c7)] bg-white px-3 text-sm text-[var(--elixir-on-surface,#1c1b1b)] outline-none transition focus:border-[var(--elixir-primary,#001515)] focus:ring-1 focus:ring-[var(--elixir-primary,#001515)]'

export const AccountForm: React.FC = () => {
  const { setUser, user } = useAuth()
  const [changePassword, setChangePassword] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    formState: { errors, isLoading, isSubmitting, isDirty },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const router = useRouter()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const body: Record<string, string | null | undefined> = changePassword
          ? {
              password: data.password,
              passwordConfirm: data.passwordConfirm,
            }
          : {
              email: data.email,
              name: data.name,
            }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}?depth=1`,
          {
          body: JSON.stringify(body),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        },
        )

        if (response.ok) {
          const json = await response.json()
          setUser(json.doc)
          toast.success('Successfully updated account.')
          setChangePassword(false)
          reset({
            name: json.doc.name,
            email: json.doc.email,
            password: '',
            passwordConfirm: '',
          })
          router.refresh()
        } else {
          toast.error('There was a problem updating your account.')
        }
      }
    },
    [user, setUser, reset, changePassword, router],
  )

  const onAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${user.name || 'Profile'} avatar`)

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadRes.ok) {
        toast.error('Unable to upload photo.')
        return
      }

      const uploaded = await uploadRes.json()
      const mediaId = uploaded?.doc?.id
      if (!mediaId) {
        toast.error('Unable to upload photo.')
        return
      }

      const patchRes = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}?depth=1`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: mediaId }),
        },
      )

      if (!patchRes.ok) {
        toast.error('Unable to update profile photo.')
        return
      }

      const json = await patchRes.json()
      setUser(json.doc)
      toast.success('Profile photo updated.')
      router.refresh()
    } catch {
      toast.error('Unable to update profile photo.')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (user === null) {
      router.push(
        `/login?error=${encodeURIComponent(
          'You must be logged in to view this page.',
        )}&redirect=${encodeURIComponent('/account/settings')}`,
      )
    }

    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, router, reset, changePassword])

  const avatar =
    user?.avatar && typeof user.avatar === 'object' ? (user.avatar as MediaType) : null

  return (
    <form className="max-w-xl" onSubmit={handleSubmit(onSubmit)}>
      {!changePassword ? (
        <Fragment>
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[var(--elixir-surface-container,#f0eded)]">
              {avatar ? (
                <Media
                  resource={avatar}
                  fill
                  imgClassName="object-cover"
                  className="relative h-full w-full"
                  size="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[var(--elixir-on-surface-variant,#414848)]">
                  Photo
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="avatar-upload"
                onChange={(e) => void onAvatarChange(e)}
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex min-h-12 cursor-pointer items-center border border-[var(--elixir-on-surface,#1c1b1b)] px-4 text-xs font-medium uppercase tracking-[0.1em]"
              >
                {avatarUploading ? 'Uploading…' : 'Change photo'}
              </label>
            </div>
          </div>

          <p className="mb-8 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            Update your details below, or{' '}
            <button
              className="underline underline-offset-4"
              onClick={() => setChangePassword(!changePassword)}
              type="button"
            >
              change your password
            </button>
            .
          </p>

          <div className="mb-8 flex flex-col gap-5">
            <FormItem>
              <label htmlFor="email" className="mb-2 block text-xs uppercase tracking-[0.1em]">
                Email Address
              </label>
              <input
                id="email"
                className={inputClassName}
                {...register('email', { required: 'Please provide an email.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <FormItem>
              <label htmlFor="name" className="mb-2 block text-xs uppercase tracking-[0.1em]">
                Name
              </label>
              <input
                id="name"
                className={inputClassName}
                {...register('name', { required: 'Please provide a name.' })}
                type="text"
              />
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <p className="mb-8 text-sm text-[var(--elixir-on-surface-variant,#414848)]">
            Choose a new password, or{' '}
            <button
              className="underline underline-offset-4"
              onClick={() => setChangePassword(!changePassword)}
              type="button"
            >
              cancel
            </button>
            .
          </p>

          <div className="mb-8 flex flex-col gap-5">
            <FormItem>
              <label htmlFor="password" className="mb-2 block text-xs uppercase tracking-[0.1em]">
                New password
              </label>
              <input
                id="password"
                className={inputClassName}
                {...register('password', { required: 'Please provide a new password.' })}
                type="password"
              />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <label
                htmlFor="passwordConfirm"
                className="mb-2 block text-xs uppercase tracking-[0.1em]"
              >
                Confirm password
              </label>
              <input
                id="passwordConfirm"
                className={inputClassName}
                {...register('passwordConfirm', {
                  required: 'Please confirm your new password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </div>
        </Fragment>
      )}
      <button
        disabled={isLoading || isSubmitting || !isDirty || avatarUploading}
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center bg-[var(--elixir-primary,#001515)] px-6 text-sm text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {isLoading || isSubmitting
          ? 'Processing'
          : changePassword
            ? 'Change Password'
            : 'Update Account'}
      </button>
    </form>
  )
}
