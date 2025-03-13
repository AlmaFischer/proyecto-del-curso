# Proyecto de Fundamentos de Ciberseguridad 2025-10
# Enunciado de la Entrega 1

## 1. Objetivos de la primera entrega

En la primera entrega, el foco está en contar con una aplicación DocLocker operativa, que implemente la funcionalidad básica. El objetivo es implementar la mayor cantidad de funciones posible, en el orden requerido, y en el tiempo dado.

## 2. Requisitos y su evaluación

Existen seis ámbitos de requisitos que son listados a continuación. Se debe implementar la funcionalidad en el orden en que se presenta en el siguiente listado con dos fechas de entrega. La entrega 1.1 es para el 31/3 a las 23:59 hrs., y la entrega 1.2 es para el 7/4 a las 23:59 hrs. Se distribuyen 100 puntos en forma decreciente a los siguientes requisitos en las dos entregas sucesivas:

1️⃣ Gestión de Cuentas de Clientes (Entrega 1.1; 35 puntos)
1. Todos los clientes de Saul, listados en el archivo JSON de metainformación (grupoXX_docmanifest.json), deben tener sus cuentas creadas en el sistema. 
2. Cada cuenta incluirá un email y una contraseña.
3. La contraseña inicial puede ser establecida por los desarrolladores de DocLocker.
4. La aplicación debe permitir el inicio de sesión con nombre de usuario (o correo) y constraseña, y el acceso a una página de inicio para el usuario.

2️⃣ Acceso a Documentos para Clientes (Entrega 1.1; 25 puntos)
1. Los clientes pueden ver el listado de sus documentos en su página de inicio.
2. Los clientes solo pueden acceder a los documentos donde su email aparece en la metainformación.
3. Pueden ver y descargar los documentos en formato PDF, listos para la firma.
4. No pueden modificar documentos ni acceder a información ajena.

3️⃣ Sistema de Comentarios en Documentos (Entrega 1.2; 15 puntos)
1. Cada documento tiene un hilo de comentarios.
2. Los clientes pueden escribir comentarios relacionados con el documento.
3. No hay comentarios anidados; sólo una lista de mensajes en orden cronológico.
4. Saul podrá leer estos comentarios y hacer modificaciones en los documentos según corresponda.

4️⃣ Cuenta de Administrador de Saul (Entrega 1.2; 15 puntos)
1. Saul Goodman debe tener una cuenta de administrador con acceso irrestricto.
2. Como administrador, podrá crear, editar y eliminar documentos sin restricciones.

5️⃣ Gestión de Usuarios para el Administador (Entrega 2; 10 puntos)
1. Saul necesita una función para ver la lista de todos los clientes registrados en el sistema.
2. Puede ver la información de un cliente específico y consultar sus documentos legales asociados.
3. También debe poder buscar a un cliente específico por nombre o email y ver sus documentos legales asociados.

6️⃣ Instalación de la aplicación en ambiente de producción (Entrega 1.2; Obligatorio)
1. A más tardar en la fecha de la entrega 1.2 la aplicación debe estar en producción. Esto quiere decir que la puesta en producción puede realizarse en cualquier momento hasta el plazo límite de la entrega 1.2. Es obligatorio entregar la aplicación en producción para tener nota final en la Entrega 1, es decir, si la aplicación no está en producción el grupo queda con nota 1,0.

La nota en la Entrega 1 se calcula de la siguiente forma:

NE1 = (P1_1 + P1_2) * 0.06 + 1

En donde P1_1 es el puntaje acumulado en la entrega 1.1, y P1_2 es el puntaje acumulado en la entrega 1.2.

## 3. Ambiente de desarrollo

Se debe contar con un ambiente de desarrollo POSIX-compatible: Linux, MacOS, Windows con WSL2 y Ubuntu o Debian, o una máquina virtual con Linux.

Además, se necesita contar con Docker Engine.

El editor preferido para desarrollar es VSCode.

Los requisitos de memoria de la aplicación son bajos. Un PC o Mac con 8GB o más RAM será suficiente para ejecutar todo.

Para comenzar a desarrollar requieres lo siguiente:

1. Que tu grupo tenga asignado un número.
2. Que hayas recibido un par clave pública - clave privada para acceder a los archivos protegidos que deberás mantener con tu aplicación en ambiente de producción.
3. Que hayas recibido una clave (`AUTH_KEY`) para acceder a la red privada Tailscale.
4. Que hayas recibido las credenciales de base de datos para tu aplicación en ambiente de producción.

### 3.1 Revisar los archivos a resguardar

Para la Entrega 1.1 debes obtener los archivos `grupoXX_usuarios.csv` y `grupoXX_docmanifest.json`. Estos archivos contienen la lista de usuarios a crear, y los documentos que están relacionados con ellos. Toda esta información la tienes que utilizar para inicializar la base de datos de tu aplicación (p.ej., generar sentencias `INSERT` para poblar la base de datos). Deberás conectarte al servidor de archivos de producción, llamado Fring (`fring.iccuandes.org`), para obtener los archivos mencionados. También puedes obtener los documentos legales en formatos markdown y PDF si quisieras revisarlos.

Para conectarte con Fring, debes hacerlo a través de una red privada virtual (VPN) de [Tailscale](https://tailscale.com/) (una Tailnet). Cuando tu aplicación quede desplegada en producción (ver sección 7), todos los archivos que tu aplicación debe resguardar estarán disponibles automáticamente en el directorio `/app/files` sin tener que configurar Tailscale, pues el ambiente de producción monta el sistema de archivos del servidor fring automáticamente.

Contando con la AUTH_KEY para usar la red Tailscale, para conectarte a la Tailnet puedes seguir [estas instrucciones](https://chatgpt.com/share/67d3213c-5074-800b-a341-37369096c068) si usas Linux, o [estas otras](https://chatgpt.com/share/67d321fa-18f8-800b-9a7d-5974c1b73a55) si usas Windows con WSL2, o finalmente, [estas instrucciones](https://chatgpt.com/share/67d32264-563c-800b-a261-a0381db017bb) si usas macOS.

Luego, una vez conectado a la Tailnet, usando sftp (secure file transfer protocol) en un terminal corre lo siguiente:

```sh
sftp -i archivo_clave_privada grupoXX@fring.iccuandes.org:fs
```

En `sftp` puedes ingresar el comando `ls` para listar los archivos, `get nombre_archivo` para descargar un archivo, o `mget *` para descargar todo. Usas el comando `quit` para salir.

Notar que los permisos de `archivo_clave_privada` deben ser 600. Puedes mantener la clave privada en un directorio seguro en tu ambiente de desarrollo, idealmente en `~/.ssh`, directorio que debe mantenerse con permisos 700.

### 3.2 Conexión a la base de datos de producción para pruebas

Para conectarte remotamente a la base de datos de tu aplicación _en producción_ (en desarrollo tendrás una base de datos local pre-configurada), debes estar conectado a la Tailnet. Además, debes tener instalado el cliente de línea de comandos de PostgreSQL, o usar PgAdmin. El servidor de base de datos en producción es "Pinkman" (pinkman.iccuandes.org).

En el cliente de línea de comandos puedes acceder a la base de datos con:

```sh
psql -h pinkman.iccuandes.org -U grupoXX -d grupoXX -W
```

Como es evidente, -h sirve para indicar el host, -U para indicar el usuario, -d para indicar la base de datos, y -W para indicar que la autenticación es con contraseña.

Luego de autenticar, podrás revisar la base de datos, la cual inicialmente estará vacía.

Puedes usar los comandos `\d` para listar tablas, `\d nombre tabla` para describir una tabla. El comando `\q` permite cerrar el cliente.

También, no menos importante, puedes cambiar la contraseña de la base de datos con el siguiente comando:

```
\password
```

### 3.3 Despliegue en ambiente de desarrollo

Para el despliegue de DocLocker en el ambiente de desarrollo, se requiere contar con Docker Engine instalado. El comando para desplegar la aplicación localmente es:

```sh
docker-compose up
```

Se pueden detener los contenedores presionando Ctrl+C.

Opcionalmente, se puede añadir la opción `-d` al comando anterior para ejecutar los contenedores en segundo plano (no de despliegan logs en consola). En este caso, para detener los contenedores se debe ingresar el comando:

```sh
docker-compose down
```

El comando `docker-compose up` también puede ejecutarse con la opción `--build` que reconstruye la imagen de la aplicación a partir de cero.

Una vez operativa la aplicación, se puede acceder a [http://localhost:3000](http://localhost:3000) para interactuar con ella.

En la raíz de este repositorio se encuentran los archivos `Dockerfile` y `docker-compose.yml`. El primero define cómo se crea la imagen de la aplicación para que pueda ejecutarse en un contenedor Docker. El segundo archivo define una configuración para ejecutar la aplicación con las variables de entorno que requiere, y la base de datos PostgreSQL. Además, define un volumen de Docker para mantener la base de datos en forma permanente y no perderla cuando se detiene su contenedor.

Existe además un script llamado `entrypoint.sh` en la raíz de este repositorio, en el cual hay comandos que se ejecutan al momento en que el contenedor con la aplicación se inicia.

## 4. Arquitectura de DocLocker

La arquitectura de DocLocker es la de una aplicación web convencional, con renderizado en el lado del servidor. Está basada en el micro-framework de aplicación web Express para Javascript (ES6+), y ejecuta con Node.js. 

La aplicación utiliza una base de datos PostgreSQL, y utiliza el módulo estándar `pg` para su conectividad a la base de datos y ejecución de consultas.

El script principal de la aplicación web es `server.js`, el cual se encuentra en la raíz del presente repositorio. En `server.js` es posible observar lo siguiente:

1. La inclusión de las dependencias de la aplicación. Algunas dependencias relevantes son `multer`, el cual es un _middleware_ utilizado con Express para facilitar la subida de archivos. Mantiene el archivo subido en memoria, y así es posible luego guardarlo en disco. Por otro lado, `express-ejs-layouts` es un módulo que permite el uso de _layouts_ en las vistas de la aplicación. Los módulos `express-session` y `session-file-store` permiten mantener sesiones y persistir la información de sesiones en el sistema de archivos.
2. La implementación de rutas y _endpoints_ de API de la aplicación. Hay varios endpoints de API que se encuentran pre-implementados, a modo de ejemplo sobre cómo usar Express: 
  * `POST /upload`, el cual permite subir archivos. Multer permite que el archivo sea accesible desde memoria mediante `req.file` (más abajo explicamos sobre los objetos `req` y `res`).
  * `GET /download/:filename`, el cual permite descargar un archivo por su nombre. Se puede ver aquí un ejemplo de cómo procesar subidas de archivo.
  * `GET /files` permite listar los archivos disponibles en DocLocker. Ejemplifica cómo interactuar con el sistema de archivos para listar un directorio.
  * `POST /login`, el cual implementa una autenticación básica de ejemplo que no toca la sesión. Se puede ver aquí el ejemplo de cómo realizar una consulta a la base de datos usando `pg`.
  * `GET /login`, el cual renderiza y envía al cliente la página de login.
  * `GET /home`, el cual renderiza y envía al cliente la página de inicio.
  * `GET /`, el cual redirige el cliente a `/login`.

Es importante notar que en Express los controladores se implementan mediante funciones del siguiente estilo:

```es6
app.post("/login", async (req, res) => { 

});
```

El objeto `app` corresponde a la aplicación Express. Este objeto permite añadir _controladores_ que implementan la lógica de un _endpoint_. En el ejemplo, la función `async (req, res) => { }` implementa el controlador para la ruta `POST /login`, y esto se infiere a partir del método `post` que es invocado sobre `app`, y el primer argumento que indica la ruta. Express permite que un controlador pueda acceder a un objeto con la petición (request) `req`, y a otro objeto para formar la respuesta `res` al cliente. La sesión queda accesible en `req.session`. Puedes ver más detalles en la [documentación de Express](https://expressjs.com/en/starter/basic-routing.html). Existen [varios ejemplos](https://expressjs.com/en/starter/examples.html) para casos de uso comunes.

Las vistas de la aplicación están en el directorio `/views`. Es posible encontrar allí el layout de la aplicación (`layout.ejs`), y plantillas para las páginas de `login` y `home`. El layout está configurado para usar Bootstrap 5, cargado desde una CDN, y carga también una biblioteca llamada lit-html para programación en las vistas con ES6+. Las llamadas a la API en `server.js` se hacen a través de [Axios](https://axios-http.com/docs/api_intro), aunque también se podría usar [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) directamente.

Finalmente, respecto a las dependencias de la aplicación, éstas se encuentran listadas en el archivo `package.json` en la raíz de este repositorio. Si bien se ha utilizado npm para crear este proyecto, se puede usar npm o Yarn para gestionar las dependencias.

Para agregar un módulo al proyecto, se puede ejecutar en la ruta raíz de este repositorio:

```sh
npm install nombre_del_modulo --save # queda agregado a package.json
```

## 5. Inicialización de la base de datos

Tanto para el ambiente de producción como para el ambiente de desarrollo, la base de datos es creada mediante la ejecución de sentencias que se encuentran en el archivo `init.sql` en la raíz del repositorio. En este archivo se pueden agregar todas las sentencias `CREATE` que requieran, junto con `INSERT` para poblar tablas con datos iniciales.

## 6. Implementación de vistas

Las vistas deben implementarse en HTML5, y los archivos se deben guardar en `/views`. En `server.js` hay ejemplos (ver `GET /login` y `GET /home`) sobre cómo se renderizan las vistas en el lado del servidor.

Es posible implementar vistas estáticas que son completamente renderizadas en el lado del servidor, y vistas dinámicas que tienen un ciclo de vida en el lado del cliente. Los desarrolladores pueden decidir si implementan todo usando vistas estáticas, o si prefieren usar vistas dinámicas; totalmente a su conveniencia.

### 6.1 Vistas estáticas (básico)

Las vistas estáticas se escriben en HTML y se puede incorporar en ellas código Javascript que es procesado en el lado del servidor, en forma equivalente a cómo se usa Embedded Ruby en Ruby on Rails. Usamos Embedded Javascript ([EJS](https://ejs.co/#docs)) encerrando el código Javascript con marcadores del estilo `<% %>` (ver sección Tags en el enlace anterior). 

El código Javascript es generalmente utilizado para "interpolar" variables en el template, en el lado del servidor antes de enviarlo al cliente. Por ejemplo, si se quisiera desplegar una lista de usuarios, el código EJS en el template sería de la siguiente manera:

```html
<table border="1">
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <% users.forEach(function(user) { %>
      <tr>
        <td><%= user.name %></td>
        <td><%= user.email %></td>
      </tr>
    <% }); %>
  </tbody>
</table>
```

Así, `user.name` y `user.email` de cada usuario quedan interpolados en una tabla. Para que esto funcione, el controlador debe renderizar el template pasando el objeto users:

```es6
// Datos de ejemplo
const users = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
];

// Ruta que renderiza la vista 'users.ejs'
router.get('/users', (req, res) => {
  res.render('users', { users: users }); // se pasan los usuarios al template
});
```

### 6.2 Vistas dinámicas (avanzado)

Con las vistas dinámicas, las vistas se construyen en el cliente (navegador web) con javascript, manipulando el DOM con una biblioteca llamada lit-html. El uso de esta biblioteca está configurado en el layout de la aplicación `views/layout.ejs`. Está permitido usar otra biblioteca si se prefiere (React, Vue, etc). Se ha preferido usar lit-html porque es liviana y apropiada para aplicaciones pequeñas. Sería posible evitar el uso de vistas dinámicas y utilizar solamente vistas estáticas, pero esto podría requerir modificar controladores en `server.js` para que implementen las interpolaciones de variables necesarias en los templates.

En las vistas de ejemplo que hay en la aplicación (home y login) se está usando [lit-html](https://lit.dev/docs/v1/lit-html/introduction/). En general, al usar lit-html se siguen estos pasos:

1. Definir un elemento html que sirve como contenedor de la vista dinámica. Ejemplo:
```html
<div id="login-container"></div>
```
2. Definir un script en la página que se ejecuta cuando la página ha terminado de cargar:
```es6
<script>
  // Esperamos a que el DOM esté completamente cargado
  document.addEventListener("DOMContentLoaded", () => {
    ...
  }
```
3. Definir en este script un template de HTML usando Javascript _template literal_:
```es6
    const loginTemplate = (message = '') => html`
      <div class="row">
        <div class="col-md-3">
          <form id="login-form" class="mt-4">
            <h2 class="mb-4">Iniciar Sesión</h2>
            <div class="mb-3">
              <label for="username" class="form-label">Usuario:</label>
              <input type="text" id="username" name="username" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Contraseña:</label>
              <input type="password" id="password" name="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary">Ingresar</button>
            ${message ? html`<p class="text-danger mt-2">${message}</p>` : null}
          </form>
        </div>
      </div>
    `;
```
4. Inyectar el template literal en el contenedor de la vista dinámica (del paso 1):
```es6
    // window.litHtml es definido en el layout!
    const { html, render } = window.litHtml;

    // Elemento container de la página
    const container = document.getElementById('login-container');

    // Función para renderizar la vista de login
    function renderLogin(message = '') {
      render(loginTemplate(message), container);
    }
```
5. Si la vista requiere llamar endpoints del backend, se usa Axios (o Fetch API):
```es6
  const response = await axios.post('/login', { username, password }, {
    headers: { 'Content-Type': 'application/json' }
  });
  const resultData = response.data;
  if (resultData.result) {
    window.location.href = '/home';
  } else {
    renderLogin('Credenciales incorrectas. Inténtalo nuevamente.');
  }
```

## 7. Despliegue en ambiente de producción

Para el despliegue en ambiente de producción utilizamos GitHub Actions, lo cual permite automatizar el proceso. Con GitHub actions, se especifica la configuración de un _workflow_ que declara los pasos para la puesta en producción. La configuración del _workflow_ para este proyecto está en `.github/workflows/ci.yml` en este repositorio. En general no es necesario modificar esta configuración.

El workflow requiere definir varias variables secretas. Para esto, en su repositorio en GitHub, deben dirigirse a la pestaña Settings, luego en el menú izquierdo ir a _Secrets and variables_ en la sección _Security_, luego elegir _Actions_. Luego, mediante el botón "New repository secret", agregar las siguientes variables:

* `DB_HOST`: pinkman.iccuandes.org
* `DB_NAME`: grupoXX (en donde XX es el número del grupo con 0 de relleno; ejs., grupo01, grupo20).
* `DB_PASS`: la contraseña de base de datos que ha sido entregada al grupo.
* `DB_USER`: Usuario de la base de datos, grupoXX.
* `GROUP_ID`: El número del grupo (p.ej., 00, 15).
* `HOST_PORT`: 30XX (p.ej., 3001 para el grupo 1, 3020 para el grupo 20).
* `SESSIONS_SECRET`: Se puede generar con el siguiente comando:
```sh
openssl rand -hex 32
```
* `SSH_HOST`: fring.iccuandes.org
* `SSH_PRIVATE_KEY`: La clave privada que ha recibido el grupo
* `SSH_USER`: grupoXX

Además, en caso que se requiera volver a crear la base de datos a partir de cero, es posible definir la siguiente variable (cambiar a la pestaña "Variables" en la sección "Action secrets and variables"):

* `INIT_DB`: `true` para forzar la recreación del schema de base de datos según `init.db`, o eliminar la variable o asignarle valor `false` para evitar que la base de datos sea vuelta a crear cuando la aplicación se inicia.

Con las variables anteriores bien configuradas, al hacer `push` al repositorio en la rama `main`, habrá un despliegue automático de la aplicación en http://grupoXX.4104.iccuandes.org. Hay un sitio de pruebas en [http://grupotest.4104.iccuandes.org](http://grupotest.4104.iccuandes.org).

Además, es posible volver a lanzar la aplicación en producción en cualquier momento si se requiere, escogiendo la pestaña "Actions" en la navegación principal en GitHub, luego escogiendo "Deploy Node.js App with SSHFS" (ver navegación al lado izquierdo), seguido de clic en el botón "Run workflow", y finalmente "Run workflow" (botón verde).

