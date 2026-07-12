import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="smarthire_db",
        user="postgres",
        password="123456"
    )

    print("✅ Database Connected Successfully!")

    conn.close()

except Exception as e:
    print("❌ Database Connection Failed")
    print(e)