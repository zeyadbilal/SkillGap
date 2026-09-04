require("dotenv").config();

const { sequelize } = require("../src/config/database");

async function inspectDatabase() {
  try {
    await sequelize.authenticate();

    console.log("\n✅ Database connection successful\n");

    const [tables] = await sequelize.query(`
      SELECT
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `);

    console.log("=== TABLES ===");

    for (const table of tables) {
      console.log(`${table.table_schema}.${table.table_name}`);
    }

    const [columns] = await sequelize.query(`
      SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name, ordinal_position;
    `);

    console.log("\n=== COLUMNS ===");

    let currentTable = "";

    for (const column of columns) {
      const tableName = `${column.table_schema}.${column.table_name}`;

      if (tableName !== currentTable) {
        currentTable = tableName;
        console.log(`\n${tableName}`);
      }

      console.log(
        `  - ${column.column_name} | ${column.data_type} | nullable=${column.is_nullable}`,
      );
    }

    await sequelize.close();

    console.log("\n✅ Inspection complete");
  } catch (error) {
    console.error("\n❌ Database inspection failed");
    console.error(error);
    process.exit(1);
  }
}

inspectDatabase();
