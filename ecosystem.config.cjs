module.exports = {
  apps: [{
    name: 'newspulse',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000 -H 127.0.0.1',
    exec_mode: 'fork',
    instances: 1,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' },
  }],
}
