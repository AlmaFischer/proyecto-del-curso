[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/pzDxqvyM)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18816725&assignment_repo_type=AssignmentRepo)
# Proyecto de Fundamentos de Ciberseguridad 2025-10
# Enunciado General

## Introducción

Una lluviosa tarde de invierno, Saul Goodman hizo un alto en el camino. Había sido un día largo, incluso para sus estándares. Apenas unas horas antes, había logrado que un cliente saliera ileso de una negociación que casi le costó las extremidades. Un par de amenazas bien colocadas, una maniobra legal cuestionable y el tipo estaba de vuelta en su negocio, entero y sin demandas.

Saul empujó la puerta de un bar en la carretera, sacudiendo la lluvia de su abrigo. Se sentó en la barra y pidió un whisky doble con hielo. A su lado, un hombre bebía algo que, para Saul, no tenía ninguna razón de existir en un lugar como aquel: un té de hierbas.

—Vaya, amigo, ¿se te perdió el GPS y terminaste aquí en lugar de una cafetería hipster? —preguntó Saul, con su típica sonrisa socarrona.

El hombre sonrió con tranquilidad.

—Digamos que vine a desconectarme después de un workshop sobre ciberseguridad en el centro de convenciones.

Saul se inclinó un poco, curioso. No era de los que desaprovechaban una conversación, especialmente si podía sacarle algún beneficio.

—¿Ciberseguridad, eh? Pues tal vez puedas ayudarme. Estoy hasta el cuello con problemas. No es fácil ser el abogado más eficiente de Albuquerque. Uno de mis clientes dejó escapar un documento que no debía. No pasó ni una semana antes de que estuviera en manos de alguien que me odia tanto como para pagar por información. Un contrato, un acuerdo de defensa... cualquier documento que mis clientes consideren sensible puede acabar filtrado, y eso me cuesta dinero. Mucho dinero.

El profesor dejó la taza sobre la barra y observó a Saul con expresión analítica.

—Bueno… si tus problemas son filtraciones de documentos y acceso indebido, podrías resolverlo con un sistema seguro. Algo que controle los accesos, cifre la información y registre cada interacción.

Saul arqueó una ceja.

—Eso suena caro.

—O podrías dejar que un grupo de estudiantes lo haga por ti.

Saul soltó una risa breve.

—¿Estudiantes? ¿Quieres que mi estudio confíe en algo hecho por estudiantes?

—No cualquier grupo de estudiantes. Tendrás 15, tal vez 20 equipos, todos compitiendo por diseñar el mejor sistema para ti. Cada equipo tendrá que desarrollar un gestor documental donde puedas almacenar contratos, acuerdos y otros documentos legales. Solo tus clientes y tú podrán acceder a la información.

Saul inclinó la cabeza, pensativo.

—Y… ¿cómo sé cuál funciona?

El profesor sonrió.

—Los equipos no solo desarrollarán el sistema. También se atacarán entre ellos. Los estudiantes tratarán de vulnerar el software de los demás. El equipo que logre la mejor seguridad, sobreviva a los ataques y mantenga la confidencialidad de la información será el que gane. Y tú obtendrás un sistema que ha pasado por la guerra.

Los ojos de Saul brillaron.

—Entonces, los estudiantes construyen el software, lo atacan entre ellos, yo elijo el que sobreviva y me quedo con él.

—Exactamente.

Saul levantó su vaso y sonrió.

—Amigo, me gusta cómo piensas.

Brindaron. Afuera, la lluvia seguía cayendo sobre la carretera, pero dentro del bar, un trato acababa de cerrarse.

## Los Documentos de Saul: Lo que Está en Juego

Saul Goodman no confía en cualquiera. Sus clientes menos. Cada documento que maneja puede significar el éxito o la ruina de sus negocios. Contratos, mandatos, acuerdos estratégicos… todo debe estar resguardado bajo siete llaves.

Para garantizar la seguridad de esta información, cada equipo de estudiantes recibirá un paquete con documentos legales alojados en un servidor remoto. El acceso a estos archivos no será trivial: deberán conectarse mediante una VPN de [Tailscale](https://www.tailscale.com/) (una "Tailnet") y utilizar SSH para acceder al sistema de archivos.

El contenido del paquete incluye:

* 📜 Documentos legales: Se trata de contratos y mandatos en formato PDF y Markdown (.md).
* 📋 Listado de usuarios: Un archivo CSV (`grupoXX_usuarios.csv`) con las cuentas de los clientes que deberán existir en DocLocker. Las contraseñas pueden ser definidas por los desarrolladores.
* 🔍 Metainformación de documentos: Un archivo JSON (`grupoXX_docmanifest.json`) que contiene datos sobre todos los documentos, incluyendo un hash para verificar su integridad.
* Un par clave pública-clave privada (veremos esto en detalle más adelante en el curso) que permitirá acceder a los archivos protegidos.

Saul no quiere sorpresas desagradables. La información debe estar protegida contra filtraciones, accesos indebidos y alteraciones. Si algún cliente se entera de que su contrato cayó en manos equivocadas… bueno, mejor que eso no pase.

El desafío está planteado. ¿Quién podrá desarrollar el DocLocker más seguro?

## Requisitos Funcionales de DocLocker

Saul Goodman necesita que su sistema sea eficiente, seguro y fácil de usar. Sus clientes no tienen paciencia para lidiar con problemas técnicos y él mismo tampoco tiene tiempo para preocuparse por detalles innecesarios. Por eso, el sistema DocLocker debe cumplir con las algunas funcionalidades esenciales, como (1) la habilitación de cuentas de usuario para los clientes, (2) la existencia de una cuenta de administración con capacidades de administrar los documentos en DocLocker, (3) acceso a los documentos para los clientes, (4) la posibilidad de que los clientes puedan escribir sus observaciones (comentarios) respecto a los documentos, y (5) funcionalidad de gestión de usuarios para el administrador.

## Requisitos específicos por entrega de proyecto

En la carpeta `docs` de este repositorio podrás encontrar los enunciados por entrega. Para actualizar los enunciados disponibles en el futuro, puedes configurar como origen remoto de git [este repositorio](https://github.com/ICC4104-202510-Ciberseguridad/project-base), y con `pull` en la rama `main` podrás actualizar el contenido de `docs`.

```sh
git remote add 
```

También publicaremos los enunciados en el sitio web del curso.
