# Despliegue en cPanel

El juego no usa base de datos: solo PHP (para `api/catalog.php`) y archivos estáticos. El despliegue copia los archivos necesarios desde un clon del repo en cPanel a la carpeta pública.

## Piezas

- **`.cpanel.yml`**: tareas que cPanel ejecuta al pulsar *Deploy HEAD Commit*. Copia todo menos `tools/`, `docs/`, `openspec/`, `assets-originales/`, `.git*`, `.github/` y los `.md` a `DEPLOYPATH` (`/home/samirade/game-ficct.samiradev.com/`).
- **`.github/workflows/deploy.yml`**: en cada push a `main`, llama a la UAPI de cPanel (`VersionControl/update` = pull, `VersionControlDeployment/create` = deploy). Si faltan los secrets, se salta sin fallar.

## Configuración (una sola vez)

1. **cPanel → Git Version Control → Create**: clonar `https://github.com/Will-34/game_friends.git` en `/home/samirade/repositories/game_friends`.
2. **Subdominio**: cPanel → Dominios → `game-ficct.samiradev.com` con raíz `/home/samirade/game-ficct.samiradev.com` (= `DEPLOYPATH`).
3. **cPanel → Manage API Tokens → Create**: copiar el token.
4. **GitHub → Settings → Secrets and variables → Actions**: crear `CPANEL_URL` (`https://cpanel.samiradev.com`), `CPANEL_USER` y `CPANEL_TOKEN`.
5. Primer despliegue: en GitHub → Actions → *Deploy a cPanel* → *Run workflow* (o en cPanel: *Update from Remote* + *Deploy HEAD Commit*).

## Seguridad

- El token **solo** vive en los secrets de GitHub; nunca se escribe en el repo. Los secrets no se muestran en los logs ni están disponibles para workflows de forks.
- Si el token se filtra: cPanel → Manage API Tokens → revocarlo y crear otro.
- El `.htaccess` bloquea igualmente carpetas de trabajo y `.md` si llegaran a copiarse.
