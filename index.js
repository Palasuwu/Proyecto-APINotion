const axios = require('axios');
const { Client } = require('@notionhq/client');

// Configuración de Notion
const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = '6bdf3fdb6a2f420f99ce8d94a29402f9'; // Reemplaza con el ID de tu base de datos en Notion
const pageIdColumn = 'page_id'; // Reemplaza con el nombre de tu columna de ID de página en Notion

async function getRecetas() {
  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/random', {
      params: {
        apiKey: 'c7aa8c94a20d4f09b2acd1cbd728a063',
        number: '10'
      }
    });

    const recetas = response.data.recipes;

    // Crear un arreglo para almacenar los objetos de recetas
    const recetasArray = [];

    // Mapear los datos de las recetas obtenidas
    recetas.forEach((receta) => {
      const { id, title, image } = receta;

      // Crear un objeto con los datos relevantes de la receta
      const recetaData = {
        id,
        title,
        image
      };

      // Agregar el objeto al arreglo de recetas
      recetasArray.push(recetaData);
    });

    // Escribir los datos en Notion
    await writeToNotion(recetasArray);

    console.log('Datos de las recetas escritos en Notion correctamente.');
  } catch (error) {
    console.error('Error al obtener los datos de las recetas:', error);
  }
}

async function writeToNotion(recetas) {
  try {
    const pagesToCreate = recetas.map((receta) => ({
      parent: { database_id: databaseId },
      properties: {
        Title: { title: [{ text: { content: receta.title } }] },
        Image: { url: receta.image },
        [pageIdColumn]: { title: [] } // Agregar esta línea para inicializar la propiedad page_id
      }
    }));

    // Crear las páginas en Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      children: pagesToCreate
    });

    const createdPages = response.results;

    // Actualizar el ID de la página en Notion en la base de datos
    for (let i = 0; i < recetas.length; i++) {
      const receta = recetas[i];
      const pageId = createdPages[i].id;

      await notion.pages.update({
        page_id: receta.id,
        properties: {
          [pageIdColumn]: {
            rich_text: [
              {
                text: {
                  content: pageId
                }
              }
            ]
          }
        }
      });
    }
  } catch (error) {
    console.error('Error al escribir los datos en Notion:', error);
  }
}

getRecetas();
//error 