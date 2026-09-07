# swim-tracker
Track data across meets



# Infra
# .husky/pre-commit
echo "npm run lint" > .husky/pre-commit

# .husky/commit-msg
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg