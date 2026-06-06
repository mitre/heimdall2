import vue2 from '@vitejs/plugin-vue2';
import path from 'path';
import {defineConfig} from 'vite';
import svgLoader from 'vite-svg-loader';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import Components from 'unplugin-vue-components/vite';
import {VuetifyResolver} from 'unplugin-vue-components/resolvers';
import {readFileSync} from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [
    vue2(),
    svgLoader(),
    nodePolyfills({
      globals: {Buffer: true, global: true, process: true},
      protocolImports: true,
    }),
    Components({
      resolvers: [VuetifyResolver()],
      dirs: [],
    }),
  ],
  resolve: {
    alias: [
      {find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/'},
      {find: '@mitre/hdf-converters', replacement: path.resolve(__dirname, '../../libs/hdf-converters/index.ts')},
      {find: 'inspecjs', replacement: path.resolve(__dirname, '../../libs/inspecjs/src/index.ts')},
      {find: '@heimdall/common', replacement: path.resolve(__dirname, '../../libs/common/index.ts')},
    ],
  },
  define: {
    'process.env.PACKAGE_VERSION': JSON.stringify(packageJson.version || ''),
    'process.env.DESCRIPTION': JSON.stringify(packageJson.description || ''),
    'process.env.REPOSITORY': JSON.stringify(packageJson.repository?.url || ''),
    'process.env.LICENSE': JSON.stringify(packageJson.license || ''),
    'process.env.CHANGELOG': JSON.stringify(packageJson.changelog || ''),
    'process.env.BRANCH': JSON.stringify(packageJson.branch || ''),
    'process.env.ISSUES': JSON.stringify(packageJson.issues || ''),
  },
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: ['@import', path.resolve(__dirname, 'src/sass/variables.scss')].join(' ') + '\n',
        silenceDeprecations: ['import', 'if-function', 'global-builtin', 'color-functions', 'slash-div'],
      },
      scss: {
        additionalData: `@import "${path.resolve(__dirname, 'src/sass/variables.scss')}";\n`,
        silenceDeprecations: ['import', 'if-function', 'global-builtin', 'color-functions', 'slash-div'],
      },
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/server': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/authn': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/users': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/groups': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/evaluations': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/evaluation-tags': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/apikeys': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/statistics': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
      '/api': {target: `http://127.0.0.1:${process.env.PORT || 3010}`},
    },
  },
  optimizeDeps: {
    exclude: ['vue'],
    esbuildOptions: {
      plugins: [{
        name: 'vue-file-agent-vue-resolve',
        setup(build) {
          build.onResolve({filter: /^vue$/}, (args) => {
            if (args.importer?.includes('vue-file-agent')) {
              return {path: path.resolve(__dirname, '../../node_modules/vue/dist/vue.common.js')};
            }
            return undefined;
          });
        },
      }],
    },
  },
  build: {
    outDir: '../../dist/frontend',
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message?.includes('externalized for browser compatibility')) return;
        warn(warning);
      },
      external: [],
    },
  },
});
