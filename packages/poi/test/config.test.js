import path from 'path'
import poi from '../lib'

describe('get webpack config', () => {
  process.chdir('./test/fixture')

  describe('entry', () => {
    it('use default entry', () => {
      const config = poi().getWebpackConfig()
      expect(config.entry).toEqual({
        client: [path.resolve('index.js')]
      })
    })

    it('use custom entry', () => {
      const entries = [
        'other-entry.js',
        ['other-entry.js', 'index.js'],
        { index: 'entry.js' },
        { foo: ['foo.js', 'bar.js'] }
      ]

      const [a, b, c, d] = entries.map(entry => poi({ entry }).getWebpackConfig())

      expect(a.entry).toEqual({
        client: [path.resolve(entries[0])]
      })

      expect(b.entry).toEqual({
        client: entries[1].map(v => path.resolve(v))
      })

      expect(c.entry).toEqual({
        index: [path.resolve('entry.js')]
      })

      expect(d.entry).toEqual({
        foo: ['foo.js', 'bar.js'].map(v => path.resolve(v))
      })
    })

    it('add hmr entry', () => {
      const config = poi({
        entry: 'index.js',
        mode: 'development'
      }).getWebpackConfig()

      expect(config.entry).toEqual({
        client: [
          path.join(__dirname, '../app/dev-client.es6'),
          path.resolve('index.js')
        ]
      })
    })
  })

  describe('output dir', () => {
    it('default dir', () => {
      const config = poi().getWebpackConfig()

      expect(config.output.path).toBe(path.resolve('dist'))
    })

    it('custom dir', () => {
      const config = poi({ dist: 'foo/bar' }).getWebpackConfig()

      expect(config.output.path).toBe(path.resolve('foo/bar'))
    })
  })

  describe('use preset', () => {
    it('in default mode', async () => {
      const preset = poi => {
        poi.webpackConfig.entry('foo')
            .add(path.resolve(poi.options.cwd, 'haha.js'))
      }
      const p = await poi({
        cwd: 'foo',
        presets: preset
      })

      await p.process()

      const config = p.webpackConfig

      expect(config.entry('foo').values()).toEqual([path.resolve('foo', 'haha.js')])
    })

    it('in dev command', async () => {
      const presets = [
        poi => {
          poi.mode('development', () => {
            poi.webpackConfig.entry('foo').add('foo')
          })
        },
        poi => {
          poi.mode('development', () => {
            poi.webpackConfig.entry('foo').add('bar')
          })
        }
      ]

      const p = poi({
        mode: 'development',
        presets
      })

      await p.process()

      const config = p.webpackConfig

      expect(config.entry('foo').values()).toEqual(['foo', 'bar'])
    })
  })
})
