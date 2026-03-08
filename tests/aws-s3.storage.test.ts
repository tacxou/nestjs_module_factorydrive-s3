import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  FileNotFoundException,
  NoSuchBucketException,
  PermissionMissingException,
  UnknownException,
} from '@tacxou/nestjs_module_factorydrive'
import { AwsS3Storage } from '../src/aws-s3.storage'

type ErrorWithStatus = Error & { statusCode?: number }

function makeError(name: string, statusCode?: number): ErrorWithStatus {
  const error = new Error(name) as ErrorWithStatus
  error.name = name
  if (statusCode !== undefined) {
    error.statusCode = statusCode
  }
  return error
}

function createStorage() {
  const storage = new AwsS3Storage({
    bucket: 'my-bucket',
    region: 'eu-west-1',
    credentials: {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    },
  })

  const driver = {
    copyObject: mock(async (params: unknown) => ({ copied: params })),
    deleteObject: mock(async (params: unknown) => ({ deleted: params })),
    headObject: mock(async (params: unknown): Promise<Record<string, unknown>> => ({ head: params })),
    getObject: mock(async (_params: unknown) => ({
      Body: {
        transformToByteArray: async () => new Uint8Array(Buffer.from('hello')),
      },
    })),
    putObject: mock(async (params: unknown) => ({ put: params })),
    listObjectsV2: mock(async () => ({
      NextContinuationToken: undefined as string | undefined,
      Contents: [] as Array<{ Key: string }>,
    })),
  }

  ;(storage as unknown as { $driver: unknown }).$driver = driver

  return { storage, driver }
}

describe('AwsS3Storage', () => {
  beforeEach(() => {
    mock.restore()
  })

  it('retourne le driver', () => {
    const { storage, driver } = createStorage()
    expect(storage.driver()).toBe(driver as unknown as ReturnType<AwsS3Storage['driver']>)
  })

  it('copy copie un fichier avec les bons paramètres', async () => {
    const { storage, driver } = createStorage()
    const result = await storage.copy('src.txt', 'dest.txt')

    expect(driver.copyObject).toHaveBeenCalledWith({
      Key: 'dest.txt',
      Bucket: 'my-bucket',
      CopySource: '/my-bucket/src.txt',
    })
    expect(result.raw).toEqual({
      copied: {
        Key: 'dest.txt',
        Bucket: 'my-bucket',
        CopySource: '/my-bucket/src.txt',
      },
    })
  })

  it('exists retourne false sur 404', async () => {
    const { storage, driver } = createStorage()
    driver.headObject.mockImplementationOnce(async () => {
      throw makeError('NotFound', 404)
    })

    const result = await storage.exists('missing.txt')
    expect(result.exists).toBe(false)
  })

  it('exists retourne true si headObject passe', async () => {
    const { storage } = createStorage()
    const result = await storage.exists('existing.txt')
    expect(result.exists).toBe(true)
  })

  it('getBuffer et get retournent le contenu attendu', async () => {
    const { storage } = createStorage()

    const bufferResult = await storage.getBuffer('file.txt')
    expect(bufferResult.content.equals(Buffer.from('hello'))).toBe(true)

    const textResult = await storage.get('file.txt')
    expect(textResult.content).toBe('hello')
  })

  it('getStat mappe correctement la taille et la date', async () => {
    const { storage, driver } = createStorage()
    const modifiedDate = new Date('2026-01-01T12:00:00.000Z')
    driver.headObject.mockResolvedValueOnce({
      ContentLength: 42,
      LastModified: modifiedDate,
    })

    const stat = await storage.getStat('file.txt')
    expect(stat.size).toBe(42)
    expect(stat.modified).toBe(modifiedDate)
  })

  it('move appelle copy puis delete', async () => {
    const { storage, driver } = createStorage()
    await storage.move('old.txt', 'new.txt')

    expect(driver.copyObject).toHaveBeenCalledTimes(1)
    expect(driver.deleteObject).toHaveBeenCalledTimes(1)
  })

  it('put délègue au driver S3', async () => {
    const { storage, driver } = createStorage()
    await storage.put('put.txt', 'content')

    expect(driver.putObject).toHaveBeenCalledWith({
      Key: 'put.txt',
      Body: 'content',
      Bucket: 'my-bucket',
    })
  })

  it('flatList itère sur toutes les pages', async () => {
    const { storage, driver } = createStorage()
    driver.listObjectsV2
      .mockResolvedValueOnce({
        NextContinuationToken: 'token-2',
        Contents: [{ Key: 'a.txt' }],
      })
      .mockResolvedValueOnce({
        NextContinuationToken: undefined,
        Contents: [{ Key: 'b.txt' }],
      })

    const paths: string[] = []
    for await (const item of storage.flatList('prefix/')) {
      paths.push(item.path)
    }

    expect(paths).toEqual(['a.txt', 'b.txt'])
    expect(driver.listObjectsV2).toHaveBeenCalledTimes(2)
  })

  it('mappe les erreurs connues vers les exceptions métier', async () => {
    const { storage, driver } = createStorage()

    driver.copyObject.mockImplementationOnce(async () => {
      throw makeError('NoSuchBucket')
    })
    await expect(storage.copy('a', 'b')).rejects.toBeInstanceOf(NoSuchBucketException)

    driver.deleteObject.mockImplementationOnce(async () => {
      throw makeError('NoSuchKey')
    })
    await expect(storage.delete('missing.txt')).rejects.toBeInstanceOf(FileNotFoundException)

    driver.getObject.mockImplementationOnce(async () => {
      throw makeError('AllAccessDisabled')
    })
    await expect(storage.getBuffer('secret.txt')).rejects.toBeInstanceOf(PermissionMissingException)
  })

  it('mappe les erreurs inconnues vers UnknownException', async () => {
    const { storage, driver } = createStorage()
    driver.copyObject.mockImplementationOnce(async () => {
      throw makeError('WeirdError')
    })

    await expect(storage.copy('a', 'b')).rejects.toBeInstanceOf(UnknownException)
  })
})
