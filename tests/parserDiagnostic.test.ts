import init, { LiteParse } from '@llamaindex/liteparse-wasm';
import fs from 'fs';
import path from 'path';

console.log('--- LiteParse WASM Diagnostic Initializing ---');

async function runDiagnostic() {
  try {
    // 1. Read local WASM binary directly
    const wasmPath = path.resolve('./node_modules/@llamaindex/liteparse-wasm/pkg/liteparse_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);

    // 2. Initialize LiteParse WASM module with local buffer
    console.log('Initializing WASM module with local WASM buffer...');
    await init(wasmBuffer);
    console.log('✅ LiteParse WASM initialized successfully from local buffer!');

    // 3. Instantiate LiteParse
    const parser = new LiteParse({
      outputFormat: 'markdown',
      extractBlocks: true,
      extractContentBounds: true,
    });

    console.log('✅ LiteParse instance created with config outputFormat:', parser.config.outputFormat);
  } catch (err) {
    console.error('❌ LiteParse WASM diagnostic error:', err);
  }
}

runDiagnostic();
