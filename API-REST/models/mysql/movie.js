import mysql from 'mysql2/promise'

const config = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'movieDB'
}

const connection = await mysql.createConnection(config)

export class MovieModel {
  static async getAll ({ genre }) {
    if (genre) {
      const lowerGenre = genre.toLowerCase()
      const [genres] = await connection.query(
        'SELECT id FROM genre WHERE LOWER(name) = ?', [lowerGenre]
      )
      const genreId = genres[0].id

      if (genres.length === 0) return []

      const [moviesGenre] = await connection.query(
        'SELECT M.*, G.name FROM movie M JOIN movie_genres MG JOIN genre G ON MG.genre_id = ? AND M.id = MG.movie_id AND G.id = ?', [genreId, genreId]
      )

      return moviesGenre
    }

    const [movies] = await connection.query(
      'SELECT * FROM movie'
    )
    return movies
  }

  static async getById ({ id }) {
    const [movies] = await connection.query(
      'SELECT * FROM movie WHERE id = ?', [id]
    )

    if (movies.length === 0) return null
    return movies
  }

  static async create ({ input }) {
    const {
      title,
      year,
      director,
      duration,
      poster,
      rate
    } = input

    const { genre } = input

    let resultCreatedMovie

    try {
      [resultCreatedMovie] = await connection.query(
        'INSERT INTO movie (title, year, director, duration, poster, rate) VALUES (?, ?, ?, ?, ?, ?)',
        [title, year, director, duration, poster, rate]
      )
    } catch (e) {
      throw new Error('Error creating movie')
    }

    const [genreTable] = await connection.query(
      'SELECT * FROM genre'
    )

    const genreFiltered = await genreTable.filter(item => genre.includes(item.name))

    if (genreFiltered.length !== 0) {
      const arrayId = await genreFiltered.map(item => item.id)
      try {
        for (let i = 0; i <= arrayId.length - 1; i++) {
          connection.query(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [resultCreatedMovie.insertId, arrayId[i]]
          )
        }
      } catch (e) {
        throw new Error('Error when inserting a new value')
      }
    } else {
      const arrayId = []
      try {
        for (let i = 0; i <= genre.length - 1; i++) {
          const [createdGenre] = connection.query(
            'INSERT INTO genre (name) VALUES (?)', [genre[i]]
          )
          arrayId.push(createdGenre.insertId)
        }
      } catch (e) {
        throw new Error('Error creating a new genre')
      }
      try {
        for (let i = 0; i <= arrayId.length - 1; i++) {
          connection.query(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [resultCreatedMovie.insertId, i]
          )
        }
      } catch (e) {
        throw new Error('Error when inserting a new value')
      }
    }

    const [newMovie] = await connection.query(
      'SELECT M.*, G.name FROM movie AS M JOIN movie_genres AS MG ON M.id = MG.movie_id JOIN genre AS G ON MG.genre_id = G.id WHERE M.id = ?', [resultCreatedMovie.insertId]
    )

    return newMovie
  }

  static async delete ({ id }) {
    const [deletedMovie] = await connection.query(
      'SELECT M.*, G.name FROM movie AS M JOIN movie_genres AS MG ON M.id = MG.movie_id JOIN genre AS G ON MG.genre_id = G.id WHERE M.id = ?', [id]
    )

    try {
      const [resultMovie] = await connection.query(
        'DELETE FROM movie WHERE id = ?', [id]
      )
      console.log(resultMovie)
    } catch (e) {
      throw new Error('Error deleting a movie')
    }

    try {
      const [resultMovieGenre] = await connection.query(
        'DELETE FROM movie_genres WHERE movie_id = ?', [id]
      )
      console.log(resultMovieGenre)
    } catch (e) {
      throw new Error('Error deleting a movie genre')
    }

    if (deletedMovie.length === 0) return null
    return deletedMovie
  }

  static async update ({ id, input }) {
    const keys = Object.keys(input)
    if (keys.includes('genre')) {
      const indexGenre = keys.indexOf('genre')
      keys.splice(indexGenre, 1)
    }
    const values = Object.values(input)
    const { genre } = input

    for (let i = 0; i < keys.length; i++) {
      connection.query(
        `UPDATE movie SET ${keys[i]} = ? WHERE id = ?`, [values[i], id]
      )
    }

    const [genreTable] = await connection.query(
      'SELECT * FROM genre'
    )

    const genreFiltered = await genreTable.filter(item => genre.includes(item.name))

    if (genreFiltered.length !== 0) {
      const arrayId = await genreFiltered.map(item => item.id)
      try {
        for (let i = 0; i <= arrayId.length - 1; i++) {
          connection.query(
            'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [id, arrayId[i]]
          )
        }
      } catch (e) {
        throw new Error('Error when inserting a new value')
      }
    }
    return true
  }
}
