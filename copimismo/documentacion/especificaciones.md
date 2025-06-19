# Especificaciones para crear los test (quiz)

En el apartado de Choose your quiz type se escoge "Quiz" > "Default Theme".

# Pre-configuraciones

Seleccionamos el botón que dice **"Additional Form Settings"**

- Grading System: Puntos
- Mostrar barra de progreso: Activado

# Páginas y preguntas (importante)

## Configuración de páginas

Configurar la página para que no muestre el botón de la página anterior. Esto debe hacerse si es deseable que el usuario NO pueda volver a la pregunta anterior.

## Configuración de preguntas

Marcar la casilla que dice *"Obligatorio"*, así el usuario no podrá saltarse ninguna pregunta.

### A tener en cuenta

Es necesario crear una nueva página por cada pregunta y hacer el paso de "No mostrar botón de la página anterior" con cada una, lo mismo para marcar cada pregunta como obligatoria.

### Mostrar solo una pregunta por página
Si se desea que el usuario pueda ir a la pregunta anterior modifica el valor en _Opciones > Display > Question Preferences_ (por defecto es 0) por 1 o la cantidad de preguntas que se desea se muestren por pantalla. Con esto nos ahorramos crear una pantalla nueva por cada pregunta que quiera hacerse en el test.

**Nota:** Otra forma de evitar que se pueda volver a la pregunta anterior es usar el siguiente código:

```css
a[class="qsm-btn qsm-previous qmn_btn mlw_qmn_quiz_link mlw_previous"] {
    display: none !important;
}
/* En el archivo:
copimismo\documentacion\html & css\main.css */
```

Esta linea de código permite ocultar el botón de volver sin la necesidad de hacer una página nueva por cada pregunta, y usando el método para *Mostrar solo una pregunta por página*, se pueden introducuir todas las preguntas en una misma página.

# Configuraciones

## Texto

### General

- Text Before Quiz: El contenido de *documentacion\html & css\text_before_quiz\content.html*

### Labels
- Submit Button: Enviar test
- Retake Quiz Button: Reintentar **(opcional)**
- Previus Button: Anterior
- Next Button: Siguiente
- Start Quiz Button: Empezar test
- No Answer Text: No hay respuesta

##  Opciones

### General

- Randomize Question: Randomize questions and their answers

### Display

- Quiz Page Settings: 
    - bounce (opcional)
    - Display current page number of the quiz
    - Do not scroll the page on clicking next/previous buttons

- Display the correct answer information in real-time **(opcional)**
    - Mostrar solo si la respuesta es correcta 
    - Mostrar siempre
    - No mostrar nunca (por defecto)

### Quiz Submission **(opcional)**

Si no se quiere que el usuario pueda reintentar el Quiz, se debe desmarcar la opción en _Opciones > Quiz Submission > Quiz Controls > Allow users to retake the quiz_, ya que por defecto lo permite.

## Página de resultados

Usar las plantillas creadas y los estilos de *documentacion\html & css\main.css*

## Estilo

Usar los estilos de *documentacion\html & css\main.css*  

# Lógica de puntuaciones

Las puntuaciones se dividen en:

## No aprobado *(0 - 5 puntos)*
Se incentiva al usuario a seguir practicando lo necesario para aprobar el test

## Casi aprobado (*5.5 - 7.5 puntos)*
Se incentiva al usuario a seguir practicando y se le comunica que estuvo muy cerca de pasar el test

## Aprobado *(8 - 10 puntos)*
Se le comunica al usuario que ha aprobado satisfactoriamente el test