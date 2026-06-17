module.exports = {
  apps: [
    {
      name: 'usa-web',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/usa-web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_BASE_URL: 'http://ec2-3-142-69-20.us-east-2.compute.amazonaws.com:3000',
        NEXT_BASE_URL: 'http://ec2-3-142-69-20.us-east-2.compute.amazonaws.com:3000',
      },
    },
  ],
};