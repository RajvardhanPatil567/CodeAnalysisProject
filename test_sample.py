# Sample Python file for testing the static analysis framework

def long_function_with_many_parameters(param1, param2, param3, param4, param5, param6, param7, param8):
    """This function has too many parameters and will trigger a warning"""
    result = ""
    for i in range(100):
        result += str(i)  # Inefficient string concatenation
    
    # Security vulnerability - using eval
    user_input = "2 + 2"
    dangerous_result = eval(user_input)
    
    # Another security issue - using exec
    exec("print('This is dangerous')")
    
    return result

def complex_function():
    """This function has high cyclomatic complexity"""
    x = 10
    if x > 5:
        if x > 8:
            if x > 9:
                if x == 10:
                    return "ten"
                else:
                    return "not ten"
            else:
                return "less than ten"
        else:
            return "between 5 and 8"
    else:
        return "five or less"

# This will be flagged as a very long function
def extremely_long_function():
    """This function is way too long"""
    line1 = 1
    line2 = 2
    line3 = 3
    line4 = 4
    line5 = 5
    line6 = 6
    line7 = 7
    line8 = 8
    line9 = 9
    line10 = 10
    line11 = 11
    line12 = 12
    line13 = 13
    line14 = 14
    line15 = 15
    line16 = 16
    line17 = 17
    line18 = 18
    line19 = 19
    line20 = 20
    line21 = 21
    line22 = 22
    line23 = 23
    line24 = 24
    line25 = 25
    line26 = 26
    line27 = 27
    line28 = 28
    line29 = 29
    line30 = 30
    line31 = 31
    line32 = 32
    line33 = 33
    line34 = 34
    line35 = 35
    line36 = 36
    line37 = 37
    line38 = 38
    line39 = 39
    line40 = 40
    line41 = 41
    line42 = 42
    line43 = 43
    line44 = 44
    line45 = 45
    line46 = 46
    line47 = 47
    line48 = 48
    line49 = 49
    line50 = 50
    line51 = 51
    return "This function is too long"
