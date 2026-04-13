// Language configurations with Judge0 CE language IDs
// Judge0 IDs: https://ce.judge0.com/languages/

export const LANGUAGES = [
  {
    id: 'python',
    label: 'Python 3',
    judge0Id: 71,
    monacoId: 'python',
    icon: '🐍',
    color: '#3b82f6',
    defaultCode: `# Python 3 - CompileX
def greet(name):
    return f"Hello, {name}! Welcome to CompileX 🚀"

name = input("Enter your name: ") if False else "World"
print(greet(name))

# Quick demo
for i in range(1, 6):
    print(f"  {'★' * i}")
`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    judge0Id: 63,
    monacoId: 'javascript',
    icon: '⚡',
    color: '#f59e0b',
    defaultCode: `// JavaScript - CompileX
function greet(name) {
  return \`Hello, \${name}! Welcome to CompileX 🚀\`;
}

const name = "World";
console.log(greet(name));

// Quick demo
const stars = Array.from({ length: 5 }, (_, i) => '★'.repeat(i + 1));
stars.forEach(s => console.log(' ' + s));
`,
  },
  {
    id: 'cpp',
    label: 'C++',
    judge0Id: 54,
    monacoId: 'cpp',
    icon: '⚙️',
    color: '#8b5cf6',
    defaultCode: `// C++ - CompileX
#include <iostream>
#include <string>
using namespace std;

string greet(string name) {
    return "Hello, " + name + "! Welcome to CompileX 🚀";
}

int main() {
    string name = "World";
    cout << greet(name) << endl;
    
    // Quick demo
    for (int i = 1; i <= 5; i++) {
        cout << "  ";
        for (int j = 0; j < i; j++) cout << "*";
        cout << endl;
    }
    return 0;
}
`,
  },
  {
    id: 'c',
    label: 'C',
    judge0Id: 50,
    monacoId: 'c',
    icon: '🔧',
    color: '#06b6d4',
    defaultCode: `// C - CompileX
#include <stdio.h>
#include <string.h>

void greet(const char* name) {
    printf("Hello, %s! Welcome to CompileX \\n", name);
}

int main() {
    greet("World");
    
    // Quick demo
    for (int i = 1; i <= 5; i++) {
        printf("  ");
        for (int j = 0; j < i; j++) printf("*");
        printf("\\n");
    }
    return 0;
}
`,
  },
  {
    id: 'java',
    label: 'Java',
    judge0Id: 62,
    monacoId: 'java',
    icon: '☕',
    color: '#ef4444',
    defaultCode: `// Java - CompileX
public class Main {
    static String greet(String name) {
        return "Hello, " + name + "! Welcome to CompileX 🚀";
    }
    
    public static void main(String[] args) {
        System.out.println(greet("World"));
        
        // Quick demo
        for (int i = 1; i <= 5; i++) {
            System.out.print("  ");
            for (int j = 0; j < i; j++) System.out.print("*");
            System.out.println();
        }
    }
}
`,
  },
];

export const getLanguageById = (id) => LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
export const getLanguageByJudge0Id = (j0id) => LANGUAGES.find((l) => l.judge0Id === j0id);
