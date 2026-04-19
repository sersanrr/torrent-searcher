#!/usr/bin/env node

(async () => {
  const fs = require('fs');
  const path = require('path');
  const { spawn } = require('child_process');

  const projectPath = process.env.WORKDIR || process.cwd();

  console.log('🔧 Setting up project paths...');

  // Move types.ts from server/src/types.ts to root if it exists
  const typesPath = path.join(projectPath, 'server/src/types.ts');
  const rootTypesPath = path.join(projectPath, 'types.ts');
  
  if (fs.existsSync(typesPath) && !fs.existsSync(rootTypesPath)) {
    fs.cpSync(typesPath, rootTypesPath);
    console.log('✓ Moved types.ts to root level');
  }

  // Update tsconfig.json for correct module resolution
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  const tsconfigContent = {
    compilerOptions: {
      target: "ES2022",
      module: "commonjs",
      lib: ["ES2022"],
      outDir: "./dist",
      rootDir: "./",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: "node",
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      ignoreDeprecations: "6.0"
    },
    include: [
      "server/**/*",
      "*.ts"
    ],
    exclude: [
      "node_modules", 
      "dist", 
      "frontend", 
      "tests",
      "node_modules/**/*"
    ]
  };
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
  console.log('✓ Updated tsconfig.json');

  console.log('✓ Setup complete. Running npm run build...');

  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: projectPath,
    stdio: 'inherit',
    shell: true
  });

  buildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✓ Build successful!');
      console.log('Run npm test to start tests, or npm start to run server.');
    } else {
      console.error('\n✗ Build failed');
      process.exit(1);
    }
  });
})();
