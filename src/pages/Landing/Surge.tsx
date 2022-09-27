/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { useEffect } from 'react'
import { Heading, Input, LoadingButton, Checkbox } from '@sumup/circuit-ui'
import css from '@emotion/css/macro'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import store from 'store2'
import { v4 as uuid } from 'uuid'
import { find } from 'lodash-es'
import { useHistory } from 'react-router-dom'

import ChangeLanguage from '../../components/ChangeLanguage'
import { useSetState } from '../../hooks'
import { useProfile, useProfileDispatch } from '../../models/profile'
import { Profile } from '../../types'
import { ExistingProfiles, LastUsedProfile } from '../../utils/constant'
import { getValidationHint } from '../../utils/validation'
import Header from './components/Header'
import { useAuthData } from './hooks'
import { SurgeFormFields } from './types'
import { tryHost } from './utils'

const Page: React.FC = () => {
  const { t } = useTranslation()
  const { isLoading, setIsLoading } = useAuthData()
  const [existingProfiles, setExistingProfiles, getExistingProfiles] =
    useSetState<Array<Profile>>([])
  const profileDispatch = useProfileDispatch()
  const profile = useProfile()
  const history = useHistory()
  const {
    getValues,
    register,
    handleSubmit,
    control,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<SurgeFormFields>({
    defaultValues: {
      keepCredential: false,
    },
  })

  const addProfile = (config: Omit<Profile, 'id'>): Profile => {
    const profile: Profile = {
      ...config,
      id: uuid(),
    }
    const newProfiles = [profile, ...existingProfiles]
    setExistingProfiles(newProfiles)

    if (getValues('keepCredential')) {
      store.set(ExistingProfiles, newProfiles)
      store.set(LastUsedProfile, profile.id)
    }

    return profile
  }

  const selectProfile = (id: string) => {
    getExistingProfiles().then((profiles) => {
      const profile = find(profiles, { id })

      if (profile) {
        if (getValues('keepCredential')) {
          store.set(LastUsedProfile, profile.id)
        }

        profileDispatch({
          type: 'update',
          payload: profile,
        })
      }
    })
  }

  const getHost: () => {
    protocol: string
    hostname: string
    port: string
  } = () => {
    const protocol = window.location.protocol

    if (process.env.NODE_ENV === 'production') {
      return {
        protocol,
        hostname: window.location.hostname,
        port: window.location.port || (protocol === 'https' ? '443' : '80'),
      }
    }
    return {
      protocol: process.env.REACT_APP_PROTOCOL as string,
      hostname: process.env.REACT_APP_HOST as string,
      port: process.env.REACT_APP_PORT as string,
    }
  }

  const onSubmit = (data: SurgeFormFields) => {
    if (!data.key) {
      return
    }

    const { hostname, port, protocol } = getHost()
    setIsLoading(true)

    tryHost(protocol, hostname, port, data.key)
      .then((res) => {
        clearErrors()

        const newProfile = addProfile({
          name: res.name || 'Surge for Mac',
          host: hostname,
          port: Number(port),
          key: data.key,
          platform: res.platform,
          platformVersion: res.platformVersion,
          platformBuild: res.platformBuild,
          tls: protocol === 'https:',
        })

        setIsLoading(false)
        selectProfile(newProfile.id)
      })
      .catch((err) => {
        setError('key', {
          type: 'invalid',
          message: err.message,
        })
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    const storedExistingProfiles = store.get(ExistingProfiles)
    const lastId = store.get(LastUsedProfile)

    if (storedExistingProfiles) {
      const result = find<Profile>(storedExistingProfiles, { id: lastId })

      setExistingProfiles(storedExistingProfiles)

      if (result) {
        profileDispatch({
          type: 'update',
          payload: result,
        })
      }
    }
  }, [profileDispatch, setExistingProfiles])

  useEffect(() => {
    if (profile) {
      history.replace('/home')
    }
  }, [profile, history])

  return (
    <div
      css={css`
        padding-bottom: calc(env(safe-area-inset-bottom) + 1.25rem);
      `}
    >
      <Header />

      <div tw="max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <Heading size={'tera'}>{t('landing.login')}</Heading>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="password"
            invalid={!!errors?.key}
            validationHint={getValidationHint(
              {
                required: t('devices.err_required'),
              },
              errors?.key,
            )}
            label={t('landing.key')}
            placeholder="examplekey"
            {...register('key', { required: true })}
          />

          <div>
            <Controller
              name="keepCredential"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value} onChange={field.onChange}>
                  {t('landing.remember_me')}
                </Checkbox>
              )}
            />
          </div>

          <div tw="mt-6">
            <LoadingButton
              type="submit"
              variant="primary"
              stretch
              isLoading={isLoading}
              loadingLabel={t('landing.is_loading')}
            >
              {t('landing.confirm')}
            </LoadingButton>
          </div>
        </form>
      </div>

      <div tw="mt-10">
        <ChangeLanguage />
      </div>
    </div>
  )
}

export default Page
