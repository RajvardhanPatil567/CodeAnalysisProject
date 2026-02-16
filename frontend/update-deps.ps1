# Update Tailwind CSS and related dependencies
npm uninstall @tailwindcss/postcss7-compat tailwindcss postcss autoprefixer
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Update MUI related packages
npm install @mui/material@latest @emotion/react@latest @emotion/styled@latest

# Update MUI X Data Grid
npm install @mui/x-data-grid@latest

# Create Tailwind config if it doesn't exist
if (-not (Test-Path "tailwind.config.js")) {
    npx tailwindcss init -p
}

Write-Host "Dependencies updated successfully!" -ForegroundColor Green
