#we are creating a flask web application. flask will serve our html and files (from the local directory app.py is in only) to a local server where we are able to see our code working on a local server(non-deployment at the moment).. we are "mounting" the static directory to Flask to serve our files from. 
#we import our dependencies
from flask import Flask, send_file, render_template
import pandas as pd

#when we create a Flask instance with Flask(__name__), this is in a way our introduction, we are saying this Flask has the following attributes, name is an opening statement in a way - we then follow up with the path and configurations
#static_url_path='' lets our url be simpler, without the inclusion of the default /static path, instead showing our static file directly after the root in the url.
#static_folder='static'explicitly tells Flask our static files are in our static folder, although this is the default behavior.
app = Flask(__name__, static_url_path='', static_folder='static')

#"@app.route" this binds a specific URL pathway to the view, or visualizaiton of data, we are interested in displaying. 
#('/') this is our root URL path. Whenever someone accesses our base or root URL, this route will be executed.
@app.route('/')
def index():
    #we read our cleaned csv from our static directory using pandas and create an ephemeral df.
    df = pd.read_csv("static/ca_groundwater_project_data.csv")
    #we extract the year for each object from our df, the year is the first 4 of the measurement date column, giving us the year. we could also have cleaned this up more in our intial 
    #python cleaning script, and then references the column directly in our html without sorting in the process of making the drop down, but this is a quick and easy alternative.
    #here we access Measurement Data, slice to get the data we desire to sort our drop down, sorted sorts the years for us in ascending order.
    years = sorted(set(df['Measurement Date'].str[:4]))
     #we want our html to be returned to the client through browser with the years parameter in our html being defined as the years we sorted above.
    return render_template('index.html', years=years)

#this is our /data url path. function executed when "http://localhost:5000/data" is accessed.
@app.route('/data')
#here with def data we are declaring the view we wish to see at our /data route.
def data():
    #we want to try returning to the browser and client our csv located in our static directory, using the function send_file as we are sending the file to the client 
    #to avoid errors we specify the mimetype, or multipurpose internet mail extensions type, to declare the format of our document on the internet.  
    try:
        return send_file('static/ca_groundwater_project_data.csv', mimetype='text/csv')
    #if any errors occur in the try block, or "exceptions", they are assigned to "e". 
    #we want to show the error message.
    except Exception as e:
        app.logger.error(f"Error fetching data: {e}")
        return "Error fetching data", 500

#again, __name__ is the "current" ephemeral name of our current module. 
#here we are saying if this module is set to __main__, and it is only set to main if it is being run directly by the python interpreter, from our command line. helpful for controlling execution flow.
if __name__ == '__main__':
    #we only want to run this in development right now, not deploy. if the above condition is true, run it on our development server(not a production server). we are also setting debug = True for enhanced debugging messages, auto reload, and inspection.
    app.run(debug=True)
