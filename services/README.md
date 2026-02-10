# Optional Microservices

This directory is intended to hold optional microservices written in languages like C++, Go, or Rust.

The `Makefile` in the root of the project has a `services` target that is designed to loop through the subdirectories in this `services` folder and build/run them.

## Example Structure

Each service should be in its own subdirectory. For example:

```
/services
|--/my_cpp_service
|  |-- main.cpp
|--/my_go_service
|  |-- main.go
```

## Makefile Integration

The `Makefile` contains a placeholder section to detect, compile, and run these services. You would need to add the specific compilation and execution commands for your toolchain.

**Example for C++:**

```makefile
# Inside the services target in the Makefile
if [ -f "$$service_dir/main.cpp" ]; then \
    echo "Found C++ service in $$service_dir"; \
    g++ $$service_dir/main.cpp -o $$service_dir/service && $$service_dir/service & \
fi;
```