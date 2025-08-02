use std::path::Path;

use rouille::Response;

pub fn start<P: AsRef<Path> + Send + Sync + 'static>(base_path: P) {
    println!("Now listening on localhost:44888");

    rouille::start_server("localhost:44888", move |request| {
        let response = rouille::match_assets(request, &base_path);
        if response.is_success() {
            return response.with_additional_header("Access-Control-Allow-Origin", "*");
        }

        Response::html(
            "404 error. Try <a href=\"/README.md\"`>README.md</a> or \
                        <a href=\"/src/lib.rs\">src/lib.rs</a> for example.",
        )
        .with_status_code(404)
    });
}