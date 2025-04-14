# Información sobre Usuarios y Contraseñas

## Datos de Usuario y Autenticación
El sistema permite a los usuarios autenticarse utilizando su **nombre de usuario** o **correo electrónico**, junto con una contraseña asignada automáticamente al momento de la creación del usuario.

## Formato de las Credenciales

- **Usuario**: Se genera a partir del correo electrónico registrado y toma la primera letra del dominio del mail.
- **Correo Electrónico**: Se puede utilizar como alternativa para iniciar sesión.
- **Contraseña**: Se genera automáticamente con el formato **correo_2025**.

## Ejemplo de Credenciales Generadas
Si un usuario tiene el correo **"juan.perez@example.com"**, el sistema generará automáticamente:

- **Nombre de usuario**: `juan.pereze`
- **Contraseña**: `juan.perez_2025` *(solo toma lo que esta antes del @)*

> Las contraseñas se generan dinámicamente en el script de inserción de datos, por lo que cada usuario tendrá una contraseña única basada en su correo.
> La base de datos se llena al ejecutar "docker compose up", no se vuelve a ejecutar si es que ya esta poblada la BBDD.

