import {type UserConfig, defineConfig} from 'vitest/config'
const config: UserConfig = defineConfig({test: {reporters: 'dot'}})
export default config
